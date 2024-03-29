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
    MessageAttachment,
} from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { StarboardConfig } from "database/StarboardConfigs";

const EMBEDDABLE_IMAGE_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
]

const MAX_SIZES_PER_TIER_MiB = {
    "NONE": 25,
    "TIER_1": 25,
    "TIER_2": 50,
    "TIER_3": 100,
}

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

    public async post(message: Message, config: StarboardConfig) {
        let author: GuildMember | undefined;
        try {
            author = await message.guild?.members.fetch(message.author);
        } catch (e) {
            await this.logger.error("Error fetching member for starboard", e);
        }
        
        let embeds: MessageEmbed[] = [];
        let files: string[] = [];
        let content = "";
        let total_size = 0;
        const tier = message.guild?.premiumTier ?? "NONE";
        const max_size = MAX_SIZES_PER_TIER_MiB[tier] * 1024 * 1024;

        embeds.push(new MessageEmbed()
            .setColor(author?.displayColor ? author?.displayColor : 0xFFFFFF)
            .setAuthor({
                name: author?.displayName ?? message.author.username, 
                iconURL: author?.displayAvatarURL() ?? message.author.displayAvatarURL(), 
                url: message.url 
            })
            .setDescription(message.content)
            .setURL(message.url)
            .setTimestamp(message.createdTimestamp));
        
        for (let file of message.attachments.values()) {
            if (file.contentType?.startsWith("image") ||
                EMBEDDABLE_IMAGE_EXTENSIONS.find((ext) => file.url.includes(ext))) 
            {
                embeds.push(new MessageEmbed()
                    .setURL(message.url)
                    .setImage(file.url)
                );
            }
            else if (total_size + file.size > max_size) {
                content += file.url + "\n";
            }
            else {
                files.push(file.url);
            }
        }

        let channel = await this.bot.client.channels.fetch(config.channelId);
        
        if (!channel || !channel.isText()) {
            return false;
        }
        
        return await channel.send({embeds, content: content ? content : undefined, files})
    }
}
