import { ReactionRoleConfig, ReactionRole } from "./ReactionRoleConfig";
import { PantherBot } from "../Bot";
import { MessageReaction, User, GuildMember, TextChannel, NewsChannel, Message, Collection, Snowflake, Role, Guild } from "discord.js";
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
        let reactionRole: ReactionRole = await this._reactionRoleConfig.getFromReaction(reaction.message, reaction.emoji);
        if(reactionRole === undefined) {
            return;
        }

        //Add role to user
        let member: GuildMember = reaction.message.guild.member(user);
        await this._reactionRoleConfig.addUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel)
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
        let reactionRole: ReactionRole = await this._reactionRoleConfig.getFromReaction(reaction.message, reaction.emoji);
        if(reactionRole === undefined) {
            return;
        }

        //Remove role to user
        let member: GuildMember = reaction.message.guild.member(user);
        await this._reactionRoleConfig.removeUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel)
    }

    public get reactionRoleConfig(): ReactionRoleConfig {
        return(this._reactionRoleConfig);
    }

    public async onReady() {
        let reactionRoles: ReactionRole[] = await this._reactionRoleConfig.getAll();
        let currChannel: TextChannel | NewsChannel;
        let currMessage: Message;
        
        for(let currReactionRole of reactionRoles) {
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

    private async checkUsers(message: Message, reactionRole: ReactionRole) {
        let reaction: MessageReaction = message.reactions.resolve(reactionRole.emoteID);

        if(reaction === undefined) {
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
            hasReacted = reactionUsers.has(member.user.id);
            hasRole = member.roles.cache.has(reactionRole.roleID);
            //Do we need to add role?
            if(hasReacted && !hasRole) {
                await this._reactionRoleConfig.addUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel);
            }

            //Do we need to remove role?
            else if(!hasReacted && hasRole) {
                await this._reactionRoleConfig.removeUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel);
            }
        }
    }
}