/* eslint-disable max-classes-per-file */
import { Command, PermissionLevel, CommandResult } from 'commands/Command';
import type { Bot } from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';
import { CommandGroup } from 'commands/CommandGroup';

import {
  Message, Permissions, MessageEmbed,
} from 'discord.js';
import type { HelixUser } from 'twitch/lib';

class EnableClipModeration extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('enable', PermissionLevel.Admin, 'Enables Twitch clip moderation settings for a channel', bot, {
      usage: '<channel>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    // Parse channel
    const channel = await CommandUtils.parseTextChannel(args[0], message.client);
    if (!channel || channel.type === 'DM') {
      return { sendHelp: true, command: this, message };
    }

    if (channel.guild.id !== message.guild!.id) {
      await CommandUtils.sendMessage('Please give a channel from this guild.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const result = bot.db.twitchClipMod.enable(channel);
    let messageToSend = '';
    if (result) {
      messageToSend = `Twitch clip moderation successfully enabled for ${channel.toString()}`;
      // Check for Twitch API
      if (!await bot.twitch.getApiStatus()) {
        messageToSend += '\nI do not have Twitch API access so verification will be solely through RegExp.';
      }
    } else {
      messageToSend = 'Error enabling Twitch clip moderation.';
    }

    await CommandUtils.sendMessage(messageToSend, message.channel, bot);
    return { sendHelp: false, command: this, message };
  }
}

class DisableClipModeration extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('disable', PermissionLevel.Admin, 'Disables Twitch clip moderation settings for a channel', bot, {
      usage: '<channel>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    // Parse channel
    const channel = await CommandUtils.parseTextChannel(args[0], message.client);
    if (!channel || channel.type === 'DM') {
      return { sendHelp: true, command: this, message };
    }

    if (channel.guild.id !== message.guild!.id) {
      await CommandUtils.sendMessage('Please give a channel from this guild.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const result = bot.db.twitchClipMod.disable(channel);
    let messageToSend = '';
    if (result) {
      messageToSend = `Twitch clip moderation successfully disabled for ${channel.toString()}`;
    } else {
      messageToSend = 'Error disabling Twitch clip moderation.';
    }

    await CommandUtils.sendMessage(messageToSend, message.channel, bot);
    return { sendHelp: false, command: this, message };
  }
}

class EnableApprovedChannels extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('enableapproved', PermissionLevel.Admin, 'Enables only allowing approved channels', bot, {
      usage: '<channel>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    // Parse Discord channel
    const channel = await CommandUtils.parseTextChannel(args[0], message.client);
    if (!channel || channel.type === 'DM') {
      return { sendHelp: true, command: this, message };
    }

    if (channel.guild.id !== message.guild!.id) {
      await CommandUtils.sendMessage('Please give a channel from this guild.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Check if we have Twitch
    if (!await bot.twitch.getApiStatus()) {
      await CommandUtils.sendMessage('I do not have Twitch API access.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    if (bot.db.twitchClipMod.enableApprovedOnly(channel)) {
      await CommandUtils.sendMessage(`Successfully enabled approved channels in ${channel.toString()}`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Error enabling approved channels in ${channel.toString()}`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class DisableApprovedChannels extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('disableapproved', PermissionLevel.Admin, 'Disables only allowing approved channels', bot, {
      usage: '<channel>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    // Parse Discord channel
    const channel = await CommandUtils.parseTextChannel(args[0], message.client);
    if (!channel || channel.type === 'DM') {
      return { sendHelp: true, command: this, message };
    }

    if (channel.guild.id !== message.guild!.id) {
      await CommandUtils.sendMessage('Please give a channel from this guild.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Check if we have Twitch
    if (!await bot.twitch.getApiStatus()) {
      await CommandUtils.sendMessage('I do not have Twitch API access.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    if (bot.db.twitchClipMod.disableApprovedOnly(channel)) {
      await CommandUtils.sendMessage(`Successfully disabled approved channels in ${channel.toString()}`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Error disabling approved channels in ${channel.toString()}`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}
class AddTwitchChannel extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('addchannel', PermissionLevel.Admin, 'Adds a Twitch channel(s) to approved channels', bot, {
      usage: '<channel> <twitch channel..>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 2) {
      return { sendHelp: true, command: this, message };
    }

    // Parse Discord channel
    const channel = await CommandUtils.parseTextChannel(args[0], message.client);
    if (!channel || channel.type === 'DM') {
      return { sendHelp: true, command: this, message };
    }

    if (channel.guild.id !== message.guild!.id) {
      await CommandUtils.sendMessage('Please give a channel from this guild.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Check if we have Twitch
    if (!await bot.twitch.getApiStatus()) {
      await CommandUtils.sendMessage('I do not have Twitch API access.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Get Twitch users
    const twitchUsers: HelixUser[] | null = await bot.twitch.getUserIds(args.slice(1));
    if (!twitchUsers) {
      await CommandUtils.sendMessage('Unknown issue getting Twitch channels', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const addedUsers: string[] = [];
    twitchUsers.forEach(async (user) => {
      if (user && bot.db.twitchClipMod.addApprovedChannel(channel, user.id)) {
        addedUsers.push(user.displayName);
      }
    });

    if (addedUsers.length === 0) {
      await CommandUtils.sendMessage('No channels added.', message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Successfully added channels: ${addedUsers.join(', ')}`, message.channel, bot);
    }
    return { sendHelp: false, command: this, message };
  }
}

class DeleteTwitchChannel extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('delchannel', PermissionLevel.Admin, 'Deletes a Twitch channel(s) from approved channels', bot, {
      usage: '<channel> <twitch channel..>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 2) {
      return { sendHelp: true, command: this, message };
    }

    // Parse Discord channel
    const channel = await CommandUtils.parseTextChannel(args[0], message.client);
    if (!channel || channel.type === 'DM') {
      return { sendHelp: true, command: this, message };
    }

    if (channel.guild.id !== message.guild!.id) {
      await CommandUtils.sendMessage('Please give a channel from this guild.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Check if we have Twitch
    if (!await bot.twitch.getApiStatus()) {
      await CommandUtils.sendMessage('I do not have Twitch API access.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Get Twitch users
    const twitchUsers: HelixUser[] | null = await bot.twitch.getUserIds(args.slice(1));
    if (!twitchUsers) {
      await CommandUtils.sendMessage('Unknown issue getting Twitch channels', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const removedUsers: string[] = [];
    twitchUsers.forEach(async (user) => {
      if (bot.db.twitchClipMod.removeApprovedChannel(channel, user.id)) {
        removedUsers.push(user.displayName);
      }
    });

    if (removedUsers.length === 0) {
      await CommandUtils.sendMessage('No channels removed.', message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Successfully removed channels: ${removedUsers.join(', ')}`, message.channel, bot);
    }
    return { sendHelp: false, command: this, message };
  }
}

class ChannelModInfo extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('info', PermissionLevel.Admin, 'Gives info about clip moderation in a channel', bot, {
      usage: '<channel>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    // Parse channel
    const channel = await CommandUtils.parseTextChannel(args[0], message.client);
    if (!channel || channel.type === 'DM') {
      return { sendHelp: true, command: this, message };
    }

    if (channel.guild.id !== message.guild!.id) {
      await CommandUtils.sendMessage('Please give a channel from this guild.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Get config
    const config = bot.db.twitchClipMod.getChannelConfig(channel);
    const approvedChannels = bot.db.twitchClipMod.getApprovedChannels(channel);

    if (config === null || approvedChannels === null) {
      await CommandUtils.sendMessage('Error getting from db, please try again later.', message.channel, bot, message);
      return { sendHelp: false, command: this, message };
    }

    const embed: MessageEmbed = new MessageEmbed();
    embed.setColor(await CommandUtils.getSelfColor(message.channel, bot));
    embed.setTitle('Twitch Clip Moderation Status');

    if (!config) {
      embed.addField('Enabled', 'False', true);
    } else {
      embed.addField('Channel', channel.toString(), true);
      embed.addField('Enabled', config.enabled ? 'True' : 'False', true);
      embed.addField('Twitch API', await bot.twitch.getApiStatus() ? 'True' : 'False', true);
      embed.addField('Approved Channels Only', config.approvedOnly ? 'True' : 'False', true);

      if (approvedChannels.length > 0) {
        const twitchUsers = await bot.twitch.getUsersByIds(approvedChannels);
        let usernames = '';
        if (twitchUsers) {
          twitchUsers.forEach((user) => {
            usernames += `${user.displayName}\n`;
          });
          embed.addField('Approved Channels', usernames, true);
        }
      } else {
        embed.addField('Approved Channels', 'None', true);
      }
    }

    await message.reply({ embeds: [embed] });
    return { sendHelp: false, command: this, message };
  }
}

export class ManageTwitchClipMod extends CommandGroup {
  constructor(bot: Bot) {
    super('twitchclip', 'Manages Twitch Clip moderation', bot, { runsInDm: false });

    this.registerSubCommands(bot);
  }

  protected registerSubCommands(bot: Bot): void {
    this.registerSubCommand(new EnableClipModeration(this, bot));
    this.registerSubCommand(new DisableClipModeration(this, bot));
    this.registerSubCommand(new EnableApprovedChannels(this, bot));
    this.registerSubCommand(new DisableApprovedChannels(this, bot));
    this.registerSubCommand(new AddTwitchChannel(this, bot));
    this.registerSubCommand(new DeleteTwitchChannel(this, bot));
    this.registerSubCommand(new ChannelModInfo(this, bot));
  }
}
