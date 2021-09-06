import { Logger } from 'Logger';
import Bot from 'Bot';
import ModErrorLog from 'moderrorlog/ModErrorLog';

import {
  Channel,
  GuildChannelResolvable, Message, PartialMessage, Permissions,
} from 'discord.js';
import { TwitchClipModConfig } from 'database/TwitchClipModeration';

export default class TwitchClipModManager {
  private bot: Bot;

  private logger: Logger;

  private clipRegex = /(?:https:\/\/clips\.twitch\.tv\/|https:\/\/www.twitch.tv\/\S+\/clip\/)([^?\s]+)/gi;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(bot, this);
  }

  public async onMessage(message: Message) {
    let fullMessage: Message;
    // Handle partial events
    try {
      if (message.partial) {
        fullMessage = await message.fetch();
      }
      else {
        fullMessage = message;
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
    const clipModConfig = this.bot.db.twitchClipMod.getChannelConfig(message.channel as Channel);

    if (!clipModConfig || !clipModConfig.enabled) {
      return;
    }

    await this.checkMessage(message, clipModConfig);
  }

  public async onMessageUpdate(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    let fullMessage: Message;
    try {
      if (newMessage.partial) {
        fullMessage = await newMessage.fetch();
      }
      else {
        fullMessage = newMessage;
      }
    }
    catch (err) {
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
    let deleteMessage = false;
    let matchedLinks = 0;
    let clipBroadcaster: string | null;
    let clipMatch: RegExpExecArray | null;
    let approvedChannels: string[] | null = null;

    // Get approved channel list
    if (config.approvedOnly) {
      approvedChannels = this.bot.db.twitchClipMod.getApprovedChannels(message.channel as Channel)
    }

    // Multiple clips may be in the message, loop until none left or message marked for deletion
    while (!deleteMessage && (clipMatch = this.clipRegex.exec(message.content)) !== null) {
      matchedLinks++;

      // If we have Twitch API access, check if valid clip
      if (await this.bot.twitchApiManager.getApiStatus()) {
        clipBroadcaster = await this.bot.twitchApiManager.getClipBroadcasterId(clipMatch[1]);

        if (clipBroadcaster == null) {
          // Invalid clip
          deleteMessage = true;
        } else if (config.approvedOnly) {
          if (approvedChannels && !approvedChannels.includes(clipBroadcaster)) {
            // Not an approved channel
            deleteMessage = true;
          }
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
