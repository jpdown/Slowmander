import { Logger } from "Logger";
import { PantherBot } from "Bot";
import { TwitchClipModObject } from "config/TwitchClipModConfig";
import { ModErrorLog } from "moderrorlog/ModErrorLog";

import { Message, Permissions } from "discord.js";

export class TwitchClipModManager {
    private bot: PantherBot;
    private logger: Logger;
    private clipRegex: RegExp = /(?:https:\/\/clips\.twitch\.tv\/|https:\/\/www.twitch.tv\/\S+\/clip\/)([^?\s]+)/gi;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
    }

    public async onMessage(message: Message) {
        //Handle partial events
        try {
            if(message.partial) {
                await message.fetch();
            }
        }
        catch(err) {
            await this.logger.warning("Error fetching message.", err);
            return;
        }

        if (!message.guild) {
            return;
        }

        if (message.author.bot) {
            return;
        }

        // See if message in moderated channel
        let clipModConfig: TwitchClipModObject = await this.bot.configs.twitchClipModConfig.getChannelTwitchClipMod(message.channel.id);

        if (!clipModConfig || !clipModConfig.enabled) {
            return;
        }

        await this.checkMessage(message, clipModConfig);
    }

    public async onMessageUpdate(oldMessage: Message, newMessage: Message) {
        if(!newMessage.guild) {
            return;
        }

        if (oldMessage && oldMessage.content === newMessage.content) {
            return;
        }

        if (newMessage.author.bot) {
            return;
        }

        // See if message in moderated channel
        let clipModConfig: TwitchClipModObject = await this.bot.configs.twitchClipModConfig.getChannelTwitchClipMod(newMessage.channel.id);

        if (!clipModConfig || !clipModConfig.enabled) {
            return;
        }

        await this.checkMessage(newMessage, clipModConfig);
    }

    private async checkMessage(message: Message, config: TwitchClipModObject): Promise<void> {
        let deleteMessage: boolean = false;
        let matchedLinks: number = 0;
        let clipBroadcaster: string;
        let clipMatch: RegExpExecArray;

        // Multiple clips may be in the message, loop until none left or message marked for deletion
        while (!deleteMessage && (clipMatch = this.clipRegex.exec(message.content)) !== null) {
            matchedLinks++;

            // If we have Twitch API access, check if valid clip
            if (await this.bot.twitchApiManager.getApiStatus()) {
                clipBroadcaster = await this.bot.twitchApiManager.getClipBroadcasterId(clipMatch[1]);

                if (clipBroadcaster == null) {
                    // Invalid clip
                    deleteMessage = true;
                }
                else if (config.approvedChannelsOnly && !config.twitchChannels.includes(clipBroadcaster)) {
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
        // Check for perms
        if (!message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
            await ModErrorLog.log("I do not have permission to delete a message for having an invalid Twitch clip.\n" + message.url,
                message.guild, this.bot);
            return;
        }

        // We have perms, delete
        try {
            await message.delete();
        }
        catch(err) {
            await ModErrorLog.log("Unknown error deleting invalid twitch clip message.\n" + message.url, message.guild, this.bot);
            await this.logger.error(`Error deleting invalid twitch clip message in guild ${message.guild.name}.`, err);
        }
    }
}