/* eslint-disable max-classes-per-file */
import { Command, PermissionLevel, CommandResult } from 'commands/Command';
import Bot from 'Bot';
import CommandUtils from 'utils/CommandUtils';
import CommandGroup from 'commands/CommandGroup';

import {
  Message, MessageEmbed, Permissions, Role, GuildEmoji, ReactionEmoji, GuildMember,
} from 'discord.js';

class EnableVerification extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('enable', PermissionLevel.Admin, 'Enables verification', bot, { group, runsInDm: false, requiredPerm: Permissions.FLAGS.ADMINISTRATOR });
  }

  async run(bot: Bot, message: Message): Promise<CommandResult> {
    // Check if we have a valid config before enabling
    const verificationConfig = await bot.configs.verificationConfig.getVerificationConfig(message.guild!.id);
    if (!verificationConfig) {
      await CommandUtils.sendMessage('No config found, please set the config first.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const result = await bot.configs.guildConfig.setVerificationEnabled(message.guild!.id, true);
    if (result) {
      await CommandUtils.sendMessage('Verification successfully enabled.', message.channel, bot);
    } else {
      await CommandUtils.sendMessage('Error enabling verification.', message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class DisableVerification extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('disable', PermissionLevel.Admin, 'Disables verification', bot, { group, runsInDm: false, requiredPerm: Permissions.FLAGS.ADMINISTRATOR });
  }

  async run(bot: Bot, message: Message): Promise<CommandResult> {
    const result = await bot.configs.guildConfig.setVerificationEnabled(message.guild!.id, false);
    if (result) {
      await CommandUtils.sendMessage('Verification successfully disabled.', message.channel, bot);
    } else {
      await CommandUtils.sendMessage('Error disabling verification.', message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetVerification extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('set', PermissionLevel.Admin, 'Sets verification options', bot, {
      usage: '<channel> <role> <remove reaction true/false>', group, runsInDm: false, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 3) {
      return { sendHelp: true, command: this, message };
    }

    // Parse input
    const channel = await CommandUtils.parseTextChannel(args[0], message.client);
    if (!channel || channel.type === 'DM' || channel.guild.id !== message.guild!.id) {
      await CommandUtils.sendMessage('Invalid channel specified, verification config not saved.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }
    // Check perms
    const member: GuildMember = channel.guild.members.cache.get(bot.client.user!.id)!;
    if (!channel.permissionsFor(member).has(Permissions.FLAGS.SEND_MESSAGES)) {
      await CommandUtils.sendMessage(
        'I do not have permissions to send a message in specified channel, verification config not saved.',
        message.channel, bot,
      );
      return { sendHelp: false, command: this, message };
    }

    const role: Role | null = await CommandUtils.parseRole(args[1], message.guild!);
    if (!role) {
      await CommandUtils.sendMessage('Invalid role specified, verification config not saved.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const removeReaction: boolean = args[2].toLowerCase().startsWith('t');

    // Get emote to listen for
    const emote: GuildEmoji | ReactionEmoji | undefined = await CommandUtils.getEmote(message, bot);
    if (!emote) {
      return { sendHelp: false, command: this, message };
    }

    // Check if we already have a config, if so we don't need a new message
    let messageId: string;
    const config = await bot.configs.verificationConfig.getVerificationConfig(message.guild!.id);
    if (config && config.channelID === channel.id) {
      messageId = config.messageID;
    } else {
      const verificationMessage = await CommandUtils.sendMessage(
        'Please react to this message to gain access to the rest of the server.',
        channel, bot,
      );
      messageId = verificationMessage.id;

      // React if we're not removing reactions
      if (!removeReaction) {
        await verificationMessage.react(emote);
      }
    }

    // Save verification config
    const saveResult = await bot.configs.verificationConfig.setVerificationConfig(
      message.guild!.id, channel.id, messageId, emote.identifier, role.id, removeReaction,
    );
    if (saveResult) {
      await CommandUtils.sendMessage('Verification config saved successfully, please enable it if not already enabled.', message.channel, bot);
    } else {
      await CommandUtils.sendMessage('Error saving verification config.', message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class VerificationStatus extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('status', PermissionLevel.Mod, 'Gives verification status', bot, {
      group, runsInDm: false, requiredPerm: Permissions.FLAGS.ADMINISTRATOR, aliases: ['info'],
    });
  }

  async run(bot: Bot, message: Message): Promise<CommandResult> {
    const verificationConfig = await bot.configs.verificationConfig.getVerificationConfig(message.guild!.id);
    if (!verificationConfig) {
      await CommandUtils.sendMessage('No config found, please set one first.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const embed: MessageEmbed = new MessageEmbed()
      .addField('Status', await bot.configs.guildConfig.getVerificationEnabled(message.guild!.id) ? 'Enabled' : 'Disabled', true)
      .addField('Channel', `<#${verificationConfig.channelID}>`, true)
      .addField('Emote', await CommandUtils.makeEmoteFromId(verificationConfig.emoteID, message) ?? 'Invalid', true)
      .addField('Role', `<@&${verificationConfig.roleID}>`, true)
      .setTitle(`Verification Status in ${message.guild!.name}`)
      .setColor(await CommandUtils.getSelfColor(message.channel, bot));

    await message.channel.send({ embeds: [embed] });

    return { sendHelp: false, command: this, message };
  }
}

// eslint-disable-next-line import/prefer-default-export
export class ManageVerification extends CommandGroup {
  constructor(bot: Bot) {
    super('verification', 'Manages lockdown presets', bot, { runsInDm: false });

    this.registerSubCommands(bot);
  }

  protected registerSubCommands(bot: Bot): void {
    this.registerSubCommand(new EnableVerification(this, bot));
    this.registerSubCommand(new DisableVerification(this, bot));
    this.registerSubCommand(new SetVerification(this, bot));
    this.registerSubCommand(new VerificationStatus(this, bot));
  }
}
