import { ReactionRoleConfig, ReactionRoleObject } from "../config/ReactionRoleConfig";
import { PantherBot } from "../Bot";
import { MessageReaction, User, GuildMember, TextChannel, NewsChannel, Message, Collection, Snowflake, Role, Guild, Client } from "discord.js";
import { LogLevel } from "../Logger";

export class ReactionRoleManager {
    private _reactionRoleConfig: ReactionRoleConfig;
    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this._reactionRoleConfig = new ReactionRoleConfig(bot);
    }

    public async onMessageReactionAdd(reaction: MessageReaction, user: User) {
        try {
            if(reaction.partial) {
                await reaction.fetch();
            }
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, "ReactionRoleManager:onMessageReactionAdd Error fetching reaction.", err);
        }

        //Ignore bots
        if(user.bot) {
            return;
        }

        //Ignore reactions from DMs
        if(!reaction.message.guild || reaction.message.channel.type === 'dm') {
            return;
        }

        //Try to grab reaction role
        let reactionRole: ReactionRoleObject = await this._reactionRoleConfig.getFromReaction(reaction.message, reaction.emoji);
        if(reactionRole === undefined) {
            return;
        }

        //Add role to user
        let member: GuildMember = reaction.message.guild.member(user);
        await this.addUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel)
    }

    public async onMessageReactionRemove(reaction: MessageReaction, user: User) {
        try {
            if(reaction.partial) {
                await reaction.fetch();
            }
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, "ReactionRoleManager:onMessageReactionRemove Error fetching reaction.", err);
        }

        //Ignore bots
        if(user.bot) {
            return;
        }

        //Ignore reactions from DMs
        if(!reaction.message.guild || reaction.message.channel.type === 'dm') {
            return;
        }

        //Try to grab reaction role
        let reactionRole: ReactionRoleObject = await this._reactionRoleConfig.getFromReaction(reaction.message, reaction.emoji);
        if(reactionRole === undefined) {
            return;
        }

        //Remove role from user
        let member: GuildMember = reaction.message.guild.member(user);
        await this.removeUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel)
    }

    public async onReady() {
        let guildReactionRoles: Map<Snowflake, ReactionRoleObject[]> = await this._reactionRoleConfig.getAllReactionRoles();
        let currChannel: TextChannel | NewsChannel;
        let currMessage: Message;
        
        for(let currGuild of guildReactionRoles.values()) {
            for(let currReactionRole of currGuild) {
                try {
                    currChannel = <TextChannel | NewsChannel> this.bot.client.channels.resolve(currReactionRole.channelID);
                    currMessage = await currChannel.messages.fetch(currReactionRole.messageID);

                    await this.checkUsers(currMessage, currReactionRole);
                }
                catch(err) {
                    await this.bot.logger.log(LogLevel.ERROR, "ReactionRoleManager:onReady Error checking reaction role status.", err);
                }
            }
        }
    }

    public async addReactionRole(reactionRole: ReactionRoleObject, reactionMessage: Message): Promise<boolean> {
        let dbResult: boolean = await this._reactionRoleConfig.addReactionRole(reactionRole);
        if(!dbResult) return(false);

        //React to message
        try {
            await reactionMessage.react(reactionRole.emoteID);
            return(true);
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.WARNING, "ReactionRoleManager:addReactionRole Error reacting to message, missing perms?", err);
            return(false);
        }
    }

    public async removeReactionRole(guildId: Snowflake, name: string, client: Client): Promise<boolean> {
        let removedReactionRole: ReactionRoleObject = await this._reactionRoleConfig.removeReactionRole(guildId, name);
        if(!removedReactionRole) return(false);

        //Remove our reaction
        try {
            let channel: TextChannel | NewsChannel = <TextChannel | NewsChannel> await client.channels.fetch(removedReactionRole.channelID)
            let message: Message = await channel.messages.fetch(removedReactionRole.messageID);

            let reaction: MessageReaction = message.reactions.cache.get(removedReactionRole.emoteID);
            await reaction.users.remove(client.user);

            return(true);
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.WARNING, "ReactionRoleManager:removeReactionRole Error removing reaction from message, missing perms?", err);
            return(false);
        }
    }

    public get reactionRoleConfig(): ReactionRoleConfig {
        return(this._reactionRoleConfig);
    }

    private async checkUsers(message: Message, reactionRole: ReactionRoleObject) {
        let reaction: MessageReaction = message.reactions.resolve(reactionRole.emoteID);

        if(reaction === undefined || reaction === null) {
            return;
        }

        //Fetch all members of guild
        let guildMembers: GuildMember[] = Array.from((await message.guild.members.fetch()).values());

        //Get all members who have reacted
        let tempCollection: Collection<Snowflake, User> = await reaction.users.fetch();
        let reactionUsers: Collection<Snowflake, User> = new Collection<Snowflake, User>();

        while(tempCollection.size > 0) {
            reactionUsers = reactionUsers.concat(tempCollection, reactionUsers);
            //Get next 100
            tempCollection = await reaction.users.fetch({after: tempCollection.lastKey()});
        }

        let hasReacted: boolean;
        let hasRole: boolean;

        //Iterate, updating role if necessary
        for(let member of guildMembers) {
            //ignore bots
            if(member.user.bot) continue;

            hasReacted = reactionUsers.has(member.user.id);
            hasRole = member.roles.cache.has(reactionRole.roleID);
            //Do we need to add role?
            if(hasReacted && !hasRole) {
                await this.addUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel);
            }

            //Do we need to remove role?
            else if(!hasReacted && hasRole) {
                await this.removeUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel);
            }
        }
    }

    private async addUser(member: GuildMember, reactionRole: ReactionRoleObject, channel: TextChannel | NewsChannel) {
        //Add role to user
        try {
            let role: Role = await channel.guild.roles.fetch(reactionRole.roleID);
            await member.roles.add(role);
        }
        catch(err) {
            await channel.send(`There was an error adding the role to ${member.toString()}.`);
            await this.bot.logger.log(LogLevel.ERROR, `ReactionRoleManager:addUser Error adding reaction role ${reactionRole.name} to ${member.user.username}#${member.user.discriminator}`, err);
        }
    }

    private async removeUser(member: GuildMember, reactionRole: ReactionRoleObject, channel: TextChannel | NewsChannel) {
        //Remove role from user
        try {
            let role: Role = await channel.guild.roles.fetch(reactionRole.roleID);
            await member.roles.remove(role);
        }
        catch(err) {
            await channel.send(`There was an error removing the role from ${member.toString()}.`);
            await this.bot.logger.log(LogLevel.ERROR, `ReactionRoleManager:removeUser Error removing reaction role ${reactionRole.name} from ${member.user.username}#${member.user.discriminator}`, err);
        }
    }
}