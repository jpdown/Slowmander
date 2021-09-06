import Bot from 'Bot';
import { Logger } from 'Logger';
import ModErrorLog from 'moderrorlog/ModErrorLog';

import {
  GuildMember, MessageReaction, User, Role, Permissions, Guild, PartialMessageReaction, PartialUser,
} from 'discord.js';
import { VerificationConfig } from 'database/Verification';

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

    if (!reaction.message.guild || !reaction.message.guild.me) {
      return;
    }

    // Grab verification config
    const config = this.bot.db.verification.getConfig(reaction.message.guild.id);
    if (!config || !config.enabled) {
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

    const member: GuildMember = await reaction.message.guild.members.fetch(user);

    // Verify correct message
    if (reaction.message.id != config.messageId) {
      return;
    }

    // Check if emote matches
    if (reaction.emoji.identifier === config.emoteId) {
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

    if (!reaction.message.channel.permissionsFor(reaction.message.guild.me).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      await ModErrorLog.log(`Remove reaction is enabled for verification but I do not have the Manage Messages permission in ${reaction.message.channel.toString()}.`, member.guild, this.bot);
      return;
    }

    try {
      await reaction.remove();
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
    // If no manage roles
    if (!member.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
      await ModErrorLog.log('Verification is enabled but I do not have the Manage Roles permission.', member.guild, this.bot);
    }
    // If role hierarchy messed up
    else if (member.guild.me.roles.highest.comparePositionTo(role) < 0) {
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
