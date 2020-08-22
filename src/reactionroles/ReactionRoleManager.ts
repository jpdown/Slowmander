import { ReactionRoleObject } from "../config/ReactionRoleConfig";
import { PantherBot } from "../Bot";
import { MessageReaction, User, GuildMember, TextChannel, NewsChannel, Message, Collection, Snowflake, Role, Client, Guild, Permissions } from "discord.js";
import { Logger } from "../Logger";
import { ModErrorLog } from "../moderrorlog/ModErrorLog";

export class ReactionRoleManager {
    private bot: PantherBot;
    private logger: Logger;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
    }

    public async onMessageReactionAdd(reaction: MessageReaction, user: User) {
        try {
            if(reaction.partial) {
                await reaction.fetch();
            }
        }
        catch(err) {
            await this.logger.error("Error fetching reaction.", err);
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
        let reactionRole: ReactionRoleObject = await this.bot.configs.reactionRoleConfig.getFromReaction(reaction.message, reaction.emoji);
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
            await this.logger.error("Error fetching reaction.", err);
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
        let reactionRole: ReactionRoleObject = await this.bot.configs.reactionRoleConfig.getFromReaction(reaction.message, reaction.emoji);
        if(reactionRole === undefined) {
            return;
        }

        //Remove role from user
        let member: GuildMember = reaction.message.guild.member(user);
        await this.removeUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel)
    }

    public async onReady() {
        let guildReactionRoles: Map<Snowflake, ReactionRoleObject[]> = await this.bot.configs.reactionRoleConfig.getAllReactionRoles();
        let currChannel: TextChannel | NewsChannel;
        let currMessage: Message;
        let iterableReactionRoles: IterableIterator<ReactionRoleObject[]> = guildReactionRoles.values();
        
        for(let currGuild of iterableReactionRoles) {
            for(let currReactionRole of currGuild) {
                try {
                    currChannel = <TextChannel | NewsChannel> this.bot.client.channels.resolve(currReactionRole.channelID);
                    if(!currChannel) {
                        //Broken, remove
                        await this.bot.configs.reactionRoleConfig.removeReactionRole(currReactionRole.guildID, currReactionRole.name);
                        continue;
                    }

                    try {
                        currMessage = await currChannel.messages.fetch(currReactionRole.messageID);
                    }
                    catch(err) {
                        await ModErrorLog.log(`Error checking status of reaction role "${currReactionRole.name}", does the message still exist?`, currChannel.guild, this.bot);
                        continue;
                    }

                    await this.checkUsers(currMessage, currReactionRole);
                }
                catch(err) {
                    await this.logger.error("Error checking reaction role status.", err);
                }
            }
        }
    }

    private async checkUsers(message: Message, reactionRole: ReactionRoleObject) {
        //Find our reaction
        let reaction: MessageReaction;
        for(let currReaction of message.reactions.cache.array()) {
            if(currReaction.emoji.identifier === reactionRole.emoteID) {
                reaction = currReaction;
                break;
            }
        }

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
                if(!await this.addUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel)) {
                    break;
                }
            }

            //Do we need to remove role?
            else if(!hasReacted && hasRole) {
                if(!await this.removeUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel)) {
                    break;
                }
            }
        }
    }

    private async addUser(member: GuildMember, reactionRole: ReactionRoleObject, channel: TextChannel | NewsChannel): Promise<boolean> {
        let role: Role;
        //Add role to user
        try {
            role = await channel.guild.roles.fetch(reactionRole.roleID);
            if(role) {
                await member.roles.add(role);
            }
            else {
                //Broken reaction role, remove
                await this.bot.configs.reactionRoleConfig.removeReactionRole(reactionRole.guildID, reactionRole.name);
                await ModErrorLog.log(`The role for reaction role ${reactionRole.name} has been deleted.`, role.guild, this.bot);
                return(false);
            }
        }
        catch(err) {
            await this.issueAddingOrRemoving(member, reactionRole, channel, role, true, err);
            return(false);
        }

        return(true);
    }

    private async removeUser(member: GuildMember, reactionRole: ReactionRoleObject, channel: TextChannel | NewsChannel): Promise<boolean> {
        let role: Role;
        //Remove role from user
        try {
            role = await channel.guild.roles.fetch(reactionRole.roleID);
            if(role) {
                await member.roles.remove(role);
            }
            else {
                //Broken reaction role, remove
                await this.bot.configs.reactionRoleConfig.removeReactionRole(reactionRole.guildID, reactionRole.name);
                await ModErrorLog.log(`The role for reaction role ${reactionRole.name} has been deleted.`, role.guild, this.bot);
                return(false);
            }
        }
        catch(err) {
            await this.issueAddingOrRemoving(member, reactionRole, channel, role, false, err);
            return(false);
        }

        return(true);
    }

    private async issueAddingOrRemoving(member: GuildMember, reactionRole: ReactionRoleObject, channel: TextChannel | NewsChannel, role: Role, adding: boolean, err: any) {
        let messageToSend: string;
        if(adding) {
            messageToSend = `There was an error adding the role "${role.name}" to ${member.toString()}.`;
        }
        else {
            messageToSend = `There was an error removing the role "${role.name}" from ${member.toString()}.`;
        }
        //If no manage roles
        if(!channel.guild.me.hasPermission(Permissions.FLAGS.MANAGE_ROLES)) {
            await ModErrorLog.log(messageToSend + " I do not have the Manage Roles permission.", member.guild, this.bot);
        }
        //If role hierarchy
        else if(channel.guild.me.roles.highest.comparePositionTo(role) < 0) {
            await ModErrorLog.log(messageToSend + " Incorrect hierarchy, my top role is not above.", member.guild, this.bot)
        }
        else {
            await ModErrorLog.log(messageToSend, member.guild, this.bot);
            await this.logger.error(`Unknown error occurred adding or removing reaction role ${reactionRole.name} to user ${member.user.username}#${member.user.discriminator} (${member.id}) in guild ${reactionRole.guildID}.`, err);
        }
    }
}