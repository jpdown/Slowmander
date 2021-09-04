import Bot from 'Bot';
import { Logger } from 'Logger';
import { VerificationConfigObject } from 'config/VerificationConfig';
import { ModErrorLog } from 'moderrorlog/ModErrorLog';

import {
  GuildMember, MessageReaction, User, Role, Permissions, Guild, PartialMessageReaction, PartialUser,
} from 'discord.js';

export default class VerificationManager {
  private bot: Bot;

  private logger: Logger;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(bot, this);
  }

  public async onGuildMemberAdd(member: GuildMember) {
    // Check if guild has verification enabled
    if (!await this.bot.configs.guildConfig.getVerificationEnabled(member.guild.id)) {
      return;
    }

    // Try to assign role to user
    try {
      await this.applyRole(member, true);
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

    // Check if guild has verification enabled
    if (!await this.bot.configs.guildConfig.getVerificationEnabled(reaction.message.guild.id)) {
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

    // Grab verification config
    const verificationConfig: VerificationConfigObject | undefined = await this.getVerificationConfig(member.guild);
    if (!verificationConfig) {
      await ModErrorLog.log('Verification is enabled but I do not have a config. Please set a config. Disabling verification.', member.guild, this.bot);
      await this.bot.configs.guildConfig.setVerificationEnabled(member.guild.id, false);
      return;
    }

    // Verify correct message
    if (reaction.message.id != verificationConfig.messageID) {
      return;
    }

    // Check if emote matches
    if (reaction.emoji.identifier === verificationConfig.emoteID) {
      // Try to remove role from user
      try {
        await this.applyRole(member, false);
      } catch (err) {
        await ModErrorLog.log(`Unknown error removing verification role from ${member.user.tag}`, member.guild, this.bot);
        await this.logger.error(`Error removing verification role from user ${member.user.tag} in guild ${member.guild.name}.`, err);
      }
    }

    // Check if removing reaction
    if (!verificationConfig.removeReaction) {
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

  private async applyRole(member: GuildMember, adding: boolean) {
    // If we're not in guild, give up
    if (!member.guild.me) {
      return;
    }

    // Grab verification config
    const verificationConfig: VerificationConfigObject | undefined = await this.getVerificationConfig(member.guild);
    if (!verificationConfig) {
      await ModErrorLog.log('Verification was enabled but I do not have a config. Please set a config. Disabling verification.', member.guild, this.bot);
      await this.bot.configs.guildConfig.setVerificationEnabled(member.guild.id, false);
      return;
    }

    // Find role in guild
    const role: Role | null = member.guild.roles.resolve(verificationConfig.roleID);
    // If role not found, disable verification
    if (!role) {
      await ModErrorLog.log('Verification was enabled but role was unable to be found, disabling verification.', member.guild, this.bot);
      await this.bot.configs.guildConfig.setVerificationEnabled(member.guild.id, false);
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

  private async getVerificationConfig(guild: Guild): Promise<VerificationConfigObject | undefined> {
    // Grab verification config
    const verificationConfig: VerificationConfigObject | undefined = await this.bot.configs.verificationConfig.getVerificationConfig(guild.id);
    // If we couldn't get verification config, we should disable verification
    if (!verificationConfig) {
      await ModErrorLog.log('Verification was enabled but no config was found, disabling verification.', guild, this.bot);
      await this.bot.configs.guildConfig.setVerificationEnabled(guild.id, false);
    }

    return verificationConfig;
  }
}
