import type Bot from 'Bot';
import { Logger } from 'Logger';
import ModErrorLog from 'moderrorlog/ModErrorLog';

import {
  GuildMember, MessageReaction, User, Role, Permissions, PartialMessageReaction, PartialUser, Message,
} from 'discord.js';
import type { VerificationConfig } from 'database/Verification';

export default class VerificationManager {
  private bot: Bot;

  private logger: Logger;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(bot, this);
  }

  public async onGuildMemberAdd(member: GuildMember) {
    // Check if guild has verification enabled
    const config = this.bot.db.verification.getConfig(member.guild.id);
    if (!config || !config.enabled) {
      return;
    }

    // Try to assign role to user
    try {
      await this.applyRole(member, true, config);
    } catch (err) {
      await ModErrorLog.log(`Unknown error applying verification role to ${member.user.tag}`, member.guild, this.bot);
      await this.logger.error(`Error adding verification role to user ${member.user.tag} in guild ${member.guild.name}.`, err);
    }
  }

  public async onMessageReactionAdd(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    let fullReaction: MessageReaction;
    try {
      if (reaction.partial) {
        fullReaction = await reaction.fetch();
      } else {
        fullReaction = reaction;
      }
    } catch (err) {
      await this.logger.error('Error fetching reaction.', err);
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
      await this.logger.error('Error fetching reaction message.', err);
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
      await this.logger.error('Error fetching reaction user.', err);
      return;
    }

    if (!fullMessage.guild || !fullMessage.guild.me) {
      return;
    }

    // Grab verification config
    const config = this.bot.db.verification.getConfig(fullMessage.guild.id);
    if (!config || !config.enabled) {
      return;
    }

    // Ignore bots
    if (fullUser.bot) {
      return;
    }

    // Ignore reactions from DMs
    if (!fullMessage.guild || fullMessage.channel.type === 'DM') {
      return;
    }

    const member: GuildMember = await fullMessage.guild.members.fetch(fullUser);

    // Verify correct message
    if (fullMessage.id !== config.messageId) {
      return;
    }

    // Check if emote matches
    if (fullReaction.emoji.identifier === config.emoteId) {
      // Try to remove role from user
      try {
        await this.applyRole(member, false, config);
      } catch (err) {
        await ModErrorLog.log(`Unknown error removing verification role from ${member.user.tag}`, member.guild, this.bot);
        await this.logger.error(`Error removing verification role from user ${member.user.tag} in guild ${member.guild.name}.`, err);
      }
    }

    // Check if removing reaction
    if (!config.removeReaction) {
      return;
    }

    if (!fullMessage.channel.permissionsFor(fullMessage.guild.me).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      await ModErrorLog.log(
        `Remove reaction is enabled for verification but I do not have the Manage Messages permission in ${fullMessage.channel.toString()}.`,
        member.guild, this.bot,
      );
      return;
    }

    try {
      await fullReaction.remove();
    } catch (err) {
      await ModErrorLog.log(`Unknown error removing verification reaction from ${member.user.tag}`, member.guild, this.bot);
      await this.logger.error(`Error removing verification reaction from user ${member.user.tag} in guild ${member.guild.name}.`, err);
    }
  }

  private async applyRole(member: GuildMember, adding: boolean, config: VerificationConfig) {
    // If we're not in guild, give up
    if (!member.guild.me) {
      return;
    }

    // Find role in guild
    const role: Role | null = member.guild.roles.resolve(config.roleId);
    // If role not found, disable verification
    if (!role) {
      await ModErrorLog.log('Verification was enabled but role was unable to be found, disabling verification.', member.guild, this.bot);
      this.bot.db.verification.disable(member.guild.id);
      return;
    }

    // Verify we have permissions
    if (!member.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
      // If no manage roles
      await ModErrorLog.log('Verification is enabled but I do not have the Manage Roles permission.', member.guild, this.bot);
    } else if (member.guild.me.roles.highest.comparePositionTo(role) < 0) {
      // If role hierarchy messed up
      await ModErrorLog.log('Verification is enabled but incorrect hierarchy, my top role is not above verification role.', member.guild, this.bot);
    }

    // Try to assign role to user
    if (adding) {
      await member.roles.add(role);
    } else {
      await member.roles.remove(role);
    }
  }
}
