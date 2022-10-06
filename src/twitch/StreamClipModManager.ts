import { Logger } from "Logger";
import type { Bot } from "Bot";
import { ModErrorLog } from "moderrorlog/ModErrorLog";

import {
    Channel,
    GuildChannelResolvable,
    Message,
    PartialMessage,
    Permissions,
} from "discord.js";
import type { TwitchClipModConfig } from "database/TwitchClipModeration";

export class StreamClipModManager {
    private bot: Bot;

    private logger: Logger;

    private twitchRegex =
        /(?:https:\/\/clips\.twitch\.tv\/|https:\/\/www.twitch.tv\/\S+\/clip\/)([^?\s]+)/gi;
    private youtubeRegex = /(?:https:\/\/(?:www.)youtube.com\/clip\/)([^?\s]+)/i;

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
            await this.logger.warning("Error fetching message.", err);
            return;
        }

        if (!fullMessage.guild) {
            return;
        }

        if (fullMessage.author.bot) {
            return;
        }

        // See if message in moderated channel
        const clipModConfig = this.bot.db.twitchClipMod.getChannelConfig(
            fullMessage.channel as Channel
        );

        if (!clipModConfig || !clipModConfig.enabled) {
            return;
        }

        await this.checkMessage(fullMessage, clipModConfig);
    }

    public async onMessageUpdate(
        oldMessage: Message | PartialMessage,
        newMessage: Message | PartialMessage
    ) {
        let fullMessage: Message;
        try {
            if (newMessage.partial) {
                fullMessage = await newMessage.fetch();
            } else {
                fullMessage = newMessage;
            }
        } catch (err) {
            this.logger.error("Error fetching new message.", err);
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
        const clipModConfig = this.bot.db.twitchClipMod.getChannelConfig(
            fullMessage.channel as Channel
        );

        if (!clipModConfig || !clipModConfig.enabled) {
            return;
        }

        await this.checkMessage(fullMessage, clipModConfig);
    }

    private async checkMessage(
        message: Message,
        config: TwitchClipModConfig
    ): Promise<void> {
        let twitchClipIds = await this.getTwitchRegexMatches(message.content);
        let youtubeMatches = await this.checkYoutubeRegex(message.content);
        let twitchMatches: boolean = twitchClipIds.length > 0;

        if (await this.bot.twitch.getApiStatus()) {
            if (config.approvedOnly) {
                twitchMatches = twitchMatches && await this.checkTwitchApprovedChannels(twitchClipIds, message.channel as Channel);
            } else {
                twitchMatches = twitchMatches && await this.checkTwitchValidClip(twitchClipIds, message.channel as Channel);
            }
        } else {
            twitchMatches = twitchClipIds.length > 0;
        }

        if (!twitchMatches && !youtubeMatches) {
            await this.deleteMessage(message); 
        }
    }

    private async getTwitchRegexMatches(message: string) : Promise<string[]> {
        let clipMatch: RegExpExecArray | null;
        let matches: string[] = [];

        while ((clipMatch = this.twitchRegex.exec(message)) !== null) {
            matches.push(clipMatch[1]);
        }

        // Reset lastIndex for the next test
        this.twitchRegex.lastIndex = 0;

        return matches;
    }

    private async checkTwitchApprovedChannels(clips: string[], channel: Channel): Promise<boolean> {
        let approvedChannels: string[] | null = null;
        const broadcasters: Promise<string | null>[] = [];

        approvedChannels = this.bot.db.twitchClipMod.getApprovedChannels(channel);
        clips.forEach((clip) => broadcasters.push(this.bot.twitch.getClipBroadcasterId(clip)));
        const broadcasterIds: (string | null)[] = await Promise.all(broadcasters);

        return broadcasterIds.every((clipBroadcaster) => clipBroadcaster !== null && approvedChannels?.includes(clipBroadcaster));
    }

    private async checkTwitchValidClip(clips: string[], channel: Channel): Promise<boolean> {
        const broadcasters: Promise<string | null>[] = [];
        clips.forEach((clip) => broadcasters.push(this.bot.twitch.getClipBroadcasterId(clip)));
        const broadcasterIds: (string | null)[] = await Promise.all(broadcasters);

        return broadcasterIds.every((clipBroadcaster) => clipBroadcaster !== null);
    }

    private async checkYoutubeRegex(message: string): Promise<boolean> {
        return this.youtubeRegex.test(message);
    }

    private async deleteMessage(message: Message) {
        if (!message.guild) {
            return;
        }
        // Check for perms
        if (
            !message.guild.me
                ?.permissionsIn(message.channel as GuildChannelResolvable)
                .has(Permissions.FLAGS.MANAGE_MESSAGES)
        ) {
            await ModErrorLog.log(
                `I do not have permission to delete a message for having an invalid Twitch clip.\n${message.url}`,
                message.guild,
                this.bot
            );
            return;
        }

        // We have perms, delete
        try {
            await message.delete();
        } catch (err) {
            await ModErrorLog.log(
                `Unknown error deleting invalid twitch clip message.\n${message.url}`,
                message.guild,
                this.bot
            );
            await this.logger.error(
                `Error deleting invalid twitch clip message in guild ${message.guild.name}.`,
                err
            );
        }
    }
}
