import { Logger } from 'Logger';
import type { Bot } from 'Bot';
import { ModErrorLog } from 'moderrorlog/ModErrorLog';

import {
  Channel,
  GuildChannelResolvable, Message, PartialMessage, Permissions,
} from 'discord.js';
import type { TwitchClipModConfig } from 'database/TwitchClipModeration';

export class TwitchClipModManager {
  private bot: Bot;

  private logger: Logger;

  private clipRegex = /(?:https:\/\/clips\.twitch\.tv\/|https:\/\/www.twitch.tv\/\S+\/clip\/)([^?\s]+)/gi;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(this);
  }

  public async onMessage(message: Message) {
    let fullMessage: Message;
    // Handle partial events
    try {
      if (message.partial) {
        fullMessage = await message.fetch();
      } else {
        fullMessage = message;
      }
    } catch (err) {
      await this.logger.warning('Error fetching message.', err);
      return;
    }

    if (!fullMessage.guild) {
      return;
    }

    if (fullMessage.author.bot) {
      return;
    }

    // See if message in moderated channel
    const clipModConfig = this.bot.db.twitchClipMod.getChannelConfig(fullMessage.channel as Channel);

    if (!clipModConfig || !clipModConfig.enabled) {
      return;
    }

    await this.checkMessage(fullMessage, clipModConfig);
  }

  public async onMessageUpdate(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    let fullMessage: Message;
    try {
      if (newMessage.partial) {
        fullMessage = await newMessage.fetch();
      } else {
        fullMessage = newMessage;
      }
    } catch (err) {
      this.logger.error('Error fetching new message.', err);
      return;
    }

    if (!fullMessage.guild) {
      return;
    }

    if (oldMessage && oldMessage.content === fullMessage.content) {
      return;
    }

    if (fullMessage.author.bot) {
      return;
    }

    // See if message in moderated channel
    const clipModConfig = this.bot.db.twitchClipMod.getChannelConfig(fullMessage.channel as Channel);

    if (!clipModConfig || !clipModConfig.enabled) {
      return;
    }

    await this.checkMessage(fullMessage, clipModConfig);
  }

  private async checkMessage(message: Message, config: TwitchClipModConfig): Promise<void> {
    let clipMatch: RegExpExecArray | null;
    let approvedChannels: string[] | null = null;
    let keepMessage: boolean;

    // Get approved channel list
    if (config.approvedOnly) {
      approvedChannels = this.bot.db.twitchClipMod.getApprovedChannels(message.channel as Channel);
    }

    // Multiple clips may be in the message, loop until none left or message marked for deletion
    const broadcasters: Promise<string | null>[] = [];
    if (await this.bot.twitch.getApiStatus()) {
      while ((clipMatch = this.clipRegex.exec(message.content)) !== null) {
        broadcasters.push(this.bot.twitch.getClipBroadcasterId(clipMatch[1]));
      }
    }

    const broadcasterIds: (string | null)[] = await Promise.all(broadcasters);

    if (broadcasterIds.length > 0) {
      keepMessage = broadcasterIds.every((clipBroadcaster) => {
        if (clipBroadcaster === null) {
          // Invalid clip
          return false;
        }
        if (config.approvedOnly && approvedChannels && !approvedChannels.includes(clipBroadcaster)) {
          // Not an approved channel
          return false;
        }
        return true;
      });
    } else {
      keepMessage = false;
    }

    if (!keepMessage) {
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
