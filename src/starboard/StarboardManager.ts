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
} from "discord.js";
import { CommandUtils } from "utils/CommandUtils";

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

        // If correct emote, is enabled, and == correct number of reactions, post
    }
}
