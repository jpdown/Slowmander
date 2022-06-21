import type { Bot } from "Bot";
import { Logger } from "Logger";
import { ModErrorLog } from "moderrorlog/ModErrorLog";
import type { ReactionRole } from "database/ReactionRoles";

import {
    MessageReaction,
    User,
    GuildMember,
    TextChannel,
    NewsChannel,
    Role,
    Permissions,
    PartialMessageReaction,
    PartialUser,
    Message,
    ThreadChannel,
    VoiceChannel,
} from "discord.js";
import { CommandUtils } from "utils/CommandUtils";

export class ReactionRoleManager {
    private bot: Bot;

    private logger: Logger;

    constructor(bot: Bot) {
        this.bot = bot;
        this.logger = Logger.getLogger(this);
    }

    public async onMessageReactionAdd(
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser
    ) {
        let fullReaction: MessageReaction;
        try {
            if (reaction.partial) {
                fullReaction = await reaction.fetch();
            } else {
                fullReaction = reaction;
            }
        } catch (err) {
            await this.logger.error("Error fetching reaction.", err);
            return;
        }

        let fullMessage: Message;
        try {
            if (fullReaction.message.partial) {
                fullMessage = await fullReaction.message.fetch();
            } else {
                fullMessage = fullReaction.message;
            }
        } catch (err) {
            await this.logger.error("Error fetching reaction message.", err);
            return;
        }

        let fullUser: User;
        try {
            if (user.partial) {
                fullUser = await user.fetch();
            } else {
                fullUser = user;
            }
        } catch (err) {
            await this.logger.error("Error fetching reaction user.", err);
            return;
        }

        // Ignore bots
        if (fullUser.bot) {
            return;
        }

        // Ignore reactions from DMs
        if (!fullMessage.guild || fullMessage.channel.type === "DM") {
            return;
        }

        // Try to grab reaction role
        const reactionRole = this.bot.db.reactionRoles.getReactionRole(
            fullMessage,
            fullReaction.emoji.id ? fullReaction.emoji.identifier : fullReaction.emoji.name!
        );
        if (!reactionRole) {
            return;
        }

        // Add role to user
        const member: GuildMember = await fullMessage.guild.members.fetch(
            fullUser
        );
        await this.addUser(member, reactionRole);
    }

    public async onMessageReactionRemove(
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser
    ) {
        let fullReaction: MessageReaction;
        try {
            if (reaction.partial) {
                fullReaction = await reaction.fetch();
            } else {
                fullReaction = reaction;
            }
        } catch (err) {
            await this.logger.error("Error fetching reaction.", err);
            return;
        }

        let fullMessage: Message;
        try {
            if (fullReaction.message.partial) {
                fullMessage = await fullReaction.message.fetch();
            } else {
                fullMessage = fullReaction.message;
            }
        } catch (err) {
            await this.logger.error("Error fetching reaction message.", err);
            return;
        }

        let fullUser: User;
        try {
            if (user.partial) {
                fullUser = await user.fetch();
            } else {
                fullUser = user;
            }
        } catch (err) {
            await this.logger.error("Error fetching reaction user.", err);
            return;
        }

        // Ignore bots
        if (fullUser.bot) {
            return;
        }

        // Ignore reactions from DMs
        if (!fullMessage.guild || fullMessage.channel.type === "DM") {
            return;
        }

        // Try to grab reaction role
        const reactionRole = this.bot.db.reactionRoles.getReactionRole(
            fullMessage,
            fullReaction.emoji.id ? fullReaction.emoji.identifier : fullReaction.emoji.name!
        );
        if (!reactionRole) {
            return;
        }

        // Remove role from user
        const member: GuildMember = await fullMessage.guild.members.fetch(
            fullUser
        );
        await this.removeUser(member, reactionRole, fullMessage.channel);
    }

    private async addUser(
        member: GuildMember,
        reactionRole: ReactionRole
    ): Promise<boolean> {
        let role: Role | null = null;
        // Add role to user
        try {
            role = await member.guild.roles.fetch(reactionRole.roleId);
            if (role) {
                await member.roles.add(role);
            } else {
                // Broken reaction role, remove
                this.bot.db.reactionRoles.removeReactionRole(
                    reactionRole.channelId,
                    reactionRole.messageId,
                    reactionRole.emoteId
                );
                // Get emote
                const emote = await CommandUtils.makeEmoteFromId(
                    reactionRole.emoteId
                );
                await ModErrorLog.log(
                    `The role for reaction role ${emote} in channel <#${reactionRole.channelId}> has been deleted due to missing role.`,
                    member.guild,
                    this.bot
                );
                return false;
            }
        } catch (err) {
            await this.issueAddingOrRemoving(
                member,
                reactionRole,
                role,
                true,
                err
            );
            return false;
        }

        return true;
    }

    private async removeUser(
        member: GuildMember,
        reactionRole: ReactionRole,
        channel: TextChannel | NewsChannel | ThreadChannel | VoiceChannel
    ): Promise<boolean> {
        let role: Role | null = null;
        // Remove role from user
        try {
            role = await channel.guild.roles.fetch(reactionRole.roleId);
            if (role) {
                await member.roles.remove(role);
            } else {
                // Broken reaction role, remove
                this.bot.db.reactionRoles.removeReactionRole(
                    reactionRole.channelId,
                    reactionRole.messageId,
                    reactionRole.emoteId
                );
                // Get emote
                const emote = await CommandUtils.makeEmoteFromId(
                    reactionRole.emoteId
                );
                await ModErrorLog.log(
                    `The role for reaction role ${emote} in channel <#${reactionRole.channelId}> has been deleted due to missing role.`,
                    member.guild,
                    this.bot
                );
                return false;
            }
        } catch (err) {
            await this.issueAddingOrRemoving(
                member,
                reactionRole,
                role,
                false,
                err
            );
            return false;
        }

        return true;
    }

    private async issueAddingOrRemoving(
        member: GuildMember,
        reactionRole: ReactionRole,
        role: Role | null,
        adding: boolean,
        err: any
    ) {
        let messageToSend: string;
        if (adding) {
            messageToSend = `There was an error adding the role "${
                role?.name
            }" to ${member.toString()}.`;
        } else {
            messageToSend = `There was an error removing the role "${
                role?.name
            }" from ${member.toString()}.`;
        }

        if (!member.guild.me?.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
            await ModErrorLog.log(
                `${messageToSend} I do not have the Manage Roles permission.`,
                member.guild,
                this.bot
            );
        } else if (
            role &&
            member.guild.me.roles.highest.comparePositionTo(role) < 0
        ) {
            await ModErrorLog.log(
                `${messageToSend} Incorrect hierarchy, my top role is not above.`,
                member.guild,
                this.bot
            );
        } else {
            await ModErrorLog.log(messageToSend, member.guild, this.bot);
            await this.logger.error(
                // eslint-disable-next-line max-len
                `Unknown error occurred adding or removing reaction role ${reactionRole.emoteId} in channel ${reactionRole.channelId} on message ${reactionRole.messageId} to user ${member.user.username}#${member.user.discriminator} (${member.id}) in guild ${reactionRole.guildId}.`,
                err
            );
        }
    }
}
