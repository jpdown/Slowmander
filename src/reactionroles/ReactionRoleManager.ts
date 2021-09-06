import { ReactionRoleObject } from 'config/ReactionRoleConfig';
import Bot from 'Bot';
import { Logger } from 'Logger';
import ModErrorLog from 'moderrorlog/ModErrorLog';

import {
  MessageReaction, User, GuildMember, TextChannel, NewsChannel, Message, Collection, Snowflake, Role, Permissions, PartialMessageReaction, PartialUser,
} from 'discord.js';

export default class ReactionRoleManager {
  private bot: Bot;

  private logger: Logger;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(bot, this);
  }

  public async onMessageReactionAdd(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    try {
      if (reaction.partial) {
        reaction = await reaction.fetch();
      }
    } catch (err) {
      await this.logger.error('Error fetching reaction.', err);
      return;
    }

    try {
      if (reaction.message.partial) {
        reaction.message = await reaction.message.fetch();
      }
    } catch (err) {
      await this.logger.error('Error fetching reaction message.', err);
      return;
    }

    try {
      if (user.partial) {
        user = await user.fetch();
      }
    } catch (err) {
      await this.logger.error('Error fetching reaction user.', err);
      return;
    }

    // Ignore bots
    if (user.bot) {
      return;
    }

    // Ignore reactions from DMs
    if (!reaction.message.guild || reaction.message.channel.type === 'DM') {
      return;
    }

    // Try to grab reaction role
    const reactionRole: ReactionRoleObject | undefined = await this.bot.configs.reactionRoleConfig.getFromReaction(reaction.message, reaction.emoji);
    if (reactionRole === undefined) {
      return;
    }

    // Add role to user
    const member: GuildMember = await reaction.message.guild.members.fetch(user);
    await this.addUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel);
  }

  public async onMessageReactionRemove(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    try {
      if (reaction.partial) {
        reaction = await reaction.fetch();
      }
    } catch (err) {
      await this.logger.error('Error fetching reaction.', err);
    }

    try {
      if (reaction.message.partial) {
        reaction.message = await reaction.message.fetch();
      }
    } catch (err) {
      await this.logger.error('Error fetching reaction message.', err);
      return;
    }

    try {
      if (user.partial) {
        user = await user.fetch();
      }
    } catch (err) {
      await this.logger.error('Error fetching reaction user.', err);
      return;
    }

    // Ignore bots
    if (user.bot) {
      return;
    }

    // Ignore reactions from DMs
    if (!reaction.message.guild || reaction.message.channel.type === 'DM') {
      return;
    }

    // Try to grab reaction role
    const reactionRole: ReactionRoleObject | undefined = await this.bot.configs.reactionRoleConfig.getFromReaction(reaction.message, reaction.emoji);
    if (reactionRole === undefined) {
      return;
    }

    // Remove role from user
    const member: GuildMember = await reaction.message.guild.members.fetch(user);
    await this.removeUser(member, reactionRole, <TextChannel | NewsChannel>reaction.message.channel);
  }

  private async addUser(member: GuildMember, reactionRole: ReactionRole): Promise<boolean> {
    let role: Role | null = null;
    // Add role to user
    try {
      role = await channel.guild.roles.fetch(reactionRole.roleID);
      if (role) {
        await member.roles.add(role);
      } else {
        // Broken reaction role, remove
        await this.bot.configs.reactionRoleConfig.removeReactionRole(reactionRole.guildID, reactionRole.name);
        await ModErrorLog.log(`The role for reaction role ${reactionRole.name} has been deleted.`, member.guild, this.bot);
        return false;
      }
    } catch (err) {
      await this.issueAddingOrRemoving(member, reactionRole, channel, role, true, err);
      return false;
    }

    return true;
  }

  private async removeUser(member: GuildMember, reactionRole: ReactionRoleObject, channel: TextChannel | NewsChannel): Promise<boolean> {
    let role: Role | null = null;
    // Remove role from user
    try {
      role = await channel.guild.roles.fetch(reactionRole.roleID);
      if (role) {
        await member.roles.remove(role);
      } else {
        // Broken reaction role, remove
        await this.bot.configs.reactionRoleConfig.removeReactionRole(reactionRole.guildID, reactionRole.name);
        await ModErrorLog.log(`The role for reaction role ${reactionRole.name} has been deleted.`, member.guild, this.bot);
        return false;
      }
    } catch (err) {
      await this.issueAddingOrRemoving(member, reactionRole, channel, role, false, err);
      return false;
    }

    return true;
  }

  private async issueAddingOrRemoving(member: GuildMember, reactionRole: ReactionRoleObject, channel: TextChannel | NewsChannel, role: Role | null, adding: boolean, err: any) {
    let messageToSend: string;
    if (adding) {
      messageToSend = `There was an error adding the role "${role?.name}" to ${member.toString()}.`;
    } else {
      messageToSend = `There was an error removing the role "${role?.name}" from ${member.toString()}.`;
    }
    // If no manage roles
    if (!channel.guild.me?.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
      await ModErrorLog.log(`${messageToSend} I do not have the Manage Roles permission.`, member.guild, this.bot);
    }
    // If role hierarchy
    else if (role && channel.guild.me.roles.highest.comparePositionTo(role) < 0) {
      await ModErrorLog.log(`${messageToSend} Incorrect hierarchy, my top role is not above.`, member.guild, this.bot);
    } else {
      await ModErrorLog.log(messageToSend, member.guild, this.bot);
      await this.logger.error(`Unknown error occurred adding or removing reaction role ${reactionRole.name} to user ${member.user.username}#${member.user.discriminator} (${member.id}) in guild ${reactionRole.guildID}.`, err);
    }
  }
}
