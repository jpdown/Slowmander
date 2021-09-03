import { Logger } from 'Logger';
import { Bot } from 'Bot';
import { TwitchClipModObject } from 'config/TwitchClipModConfig';
import { ModErrorLog } from 'moderrorlog/ModErrorLog';

import {
  GuildChannelResolvable, Message, PartialMessage, Permissions,
} from 'discord.js';

export class TwitchClipModManager {
  private bot: Bot;

  private logger: Logger;

  private clipRegex = /(?:https:\/\/clips\.twitch\.tv\/|https:\/\/www.twitch.tv\/\S+\/clip\/)([^?\s]+)/gi;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(bot, this);
  }

  public async onMessage(message: Message) {
    // Handle partial events
    try {
      if (message.partial) {
        message = await message.fetch();
      }
    } catch (err) {
      await this.logger.warning('Error fetching message.', err);
      return;
    }

    if (!message.guild) {
      return;
    }

    if (message.author.bot) {
      return;
    }

    // See if message in moderated channel
    const clipModConfig: TwitchClipModObject | undefined = await this.bot.configs.twitchClipModConfig.getChannelTwitchClipMod(message.channel.id);

    if (!clipModConfig || !clipModConfig.enabled) {
      return;
    }

    await this.checkMessage(message, clipModConfig);
  }

  public async onMessageUpdate(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (newMessage.partial) {
      try {
        newMessage = await newMessage.fetch();
      } catch (err) {
        this.logger.error('Error fetching new message.', err);
        return;
      }
    }

    if (!newMessage.guild) {
      return;
    }
    if (!newMessage.guild) {
      return;
    }

    if (oldMessage && oldMessage.content === newMessage.content) {
      return;
    }

    if (newMessage.author.bot) {
      return;
    }

    // See if message in moderated channel
    const clipModConfig: TwitchClipModObject | undefined = await this.bot.configs.twitchClipModConfig.getChannelTwitchClipMod(newMessage.channel.id);

    if (!clipModConfig || !clipModConfig.enabled) {
      return;
    }

    await this.checkMessage(newMessage, clipModConfig);
  }

  private async checkMessage(message: Message, config: TwitchClipModObject): Promise<void> {
    let deleteMessage = false;
    let matchedLinks = 0;
    let clipBroadcaster: string | null;
    let clipMatch: RegExpExecArray | null;

    // Multiple clips may be in the message, loop until none left or message marked for deletion
    while (!deleteMessage && (clipMatch = this.clipRegex.exec(message.content)) !== null) {
      matchedLinks++;

      // If we have Twitch API access, check if valid clip
      if (await this.bot.twitchApiManager.getApiStatus()) {
        clipBroadcaster = await this.bot.twitchApiManager.getClipBroadcasterId(clipMatch[1]);

        if (clipBroadcaster == null) {
          // Invalid clip
          deleteMessage = true;
        } else if (config.approvedChannelsOnly && !config.twitchChannels?.includes(clipBroadcaster)) {
          // Not an approved channel
          deleteMessage = true;
        }
      }
    }

    // If no links matched, delete
    if (matchedLinks === 0) {
      deleteMessage = true;
    }

    if (deleteMessage) {
      await this.deleteMessage(message);
    }
  }

  private async deleteMessage(message: Message) {
    if (!message.guild) {
      return;
    }
    // Check for perms
    if (!message.guild.me?.permissionsIn(message.channel as GuildChannelResolvable).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      await ModErrorLog.log(`I do not have permission to delete a message for having an invalid Twitch clip.\n${message.url}`,
        message.guild, this.bot);
      return;
    }

    // We have perms, delete
    try {
      await message.delete();
    } catch (err) {
      await ModErrorLog.log(`Unknown error deleting invalid twitch clip message.\n${message.url}`, message.guild, this.bot);
      await this.logger.error(`Error deleting invalid twitch clip message in guild ${message.guild.name}.`, err);
    }
  }
}
