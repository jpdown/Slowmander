import type { Bot } from "Bot";
import { Logger } from "Logger";
import { ModErrorLog } from "moderrorlog/ModErrorLog";
import type { ReactionRole } from "database/ReactionRoles";

import {
    MessageReaction,
    User,
    GuildMember,
    TextChannel,
    NewsChannel,
    Role,
    Permissions,
    PartialMessageReaction,
    PartialUser,
    Message,
    ThreadChannel,
    VoiceChannel,
    MessageEmbed,
} from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { StarboardConfig } from "database/StarboardConfigs";

export class StarboardManager {
    private bot: Bot;

    private logger: Logger;

    constructor(bot: Bot) {
        this.bot = bot;
        this.logger = Logger.getLogger(this);
    }

    public async onMessageReactionAdd(
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser
    ) {
        let fullReaction: MessageReaction;
        try {
            if (reaction.partial) {
                fullReaction = await reaction.fetch();
            } else {
                fullReaction = reaction;
            }
        } catch (err) {
            await this.logger.error("Error fetching reaction.", err);
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
            await this.logger.error("Error fetching reaction message.", err);
            return;
        }

        // Ignore reactions from DMs
        if (!fullMessage.guild || fullMessage.channel.type === "DM") {
            return;
        }

        // Load config from db
        const config = this.bot.db.starboard.getConfig(fullMessage.guildId!)

        if (!config) {
            return;
        }

        const emote = fullReaction.emoji.id ? fullReaction.emoji.identifier : fullReaction.emoji.name!;

        // If correct emote, is enabled, and == correct number of reactions, post
        if (config.enabled && config.emoteId == emote && fullReaction.count == config.numReacts) {
            await this.post(fullMessage, config);
        }
    }

    private async post(message: Message, config: StarboardConfig) {
        let author = message.member!;

        let embed = new MessageEmbed()
            .setColor(author.displayColor)
            .setAuthor({name: author.displayName, iconURL: author.displayAvatarURL() })
            .setDescription(message.content)
            .setTimestamp(message.createdTimestamp);

        let channel = await this.bot.client.channels.fetch(config.channelId);
        
        if (!channel || !channel.isText()) {
            return;
        }
        
        Array.from(message.attachments.values())

        channel.send({embeds: [embed], attachments: Array.from(message.attachments.values())})
    }
}
