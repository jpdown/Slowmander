import type BS3 from "better-sqlite3";

import type { Bot } from "Bot";
import { Logger } from "Logger";

import type { CommandInteraction, Guild, Message, Role, Snowflake } from "discord.js";

export class ReactionRoles {
    private readonly logger: Logger;

    private readonly db: BS3.Database;

    constructor(bot: Bot, db: BS3.Database) {
        this.logger = Logger.getLogger(this);
        this.db = db;
    }

    /**
     * @returns undefined when not found, null on db error
     */
    public getReactionRole(
        message: Message,
        emoteId: string
    ): ReactionRole | null | undefined {
        try {
            const row: ReactionRole | undefined = this.db
                .prepare(
                    "SELECT * FROM ReactionRoles WHERE channelId = ? AND messageId = ? AND emoteId = ?;"
                )
                .get(message.channel.id, message.id, emoteId);
            return row;
        } catch (err) {
            this.logger.error("Error getting ReactionRoles from db", err);
            return null;
        }
    }

    /**
     * @returns Empty array when none found, null on db error
     */
    public getReactionRolesByMessage(message: Message): ReactionRole[] | null {
        try {
            const rows: ReactionRole[] = this.db
                .prepare(
                    "SELECT * FROM ReactionRoles WHERE channelId = ? AND messageId = ?;"
                )
                .all(message.channel.id, message.id);
            return rows;
        } catch (err) {
            this.logger.error("Error getting ReactionRoles from db", err);
            return null;
        }
    }

    /**
     * @returns Empty array when none found, null on db error
     */
    public getReactionRolesByGuild(guild: Guild): ReactionRole[] | null {
        try {
            const rows: ReactionRole[] = this.db
                .prepare("SELECT * FROM ReactionRoles WHERE guildId = ?;")
                .all(guild.id);
            return rows;
        } catch (err) {
            this.logger.error("Error getting ReactionRoles from db", err);
            return null;
        }
    }

    public setReactionRole(
        message: Message | CommandInteraction,
        emoteId: string,
        role: Role
    ): boolean {
        let rowsModified = 0;

        if (message.guild?.id !== role.guild.id) {
            return false;
        }

        // is not handling this just okay? we shouldn't ever have no channel with a command
        if (message.channel === null) { 
            return false;
        }

        try {
            const info = this.db
                .prepare(
                    "INSERT INTO ReactionRoles(channelId, messageId, emoteId, roleId, guildId) " +
                        "VALUES(?, ?, ?, ?, ?) " +
                        "ON CONFLICT(channelId, messageId, emoteId) DO UPDATE SET roleId=excluded.roleId;"
                )
                .run(
                    message.channel.id,
                    message.id,
                    emoteId,
                    role.id,
                    message.guild.id
                );
            rowsModified = info.changes;
        } catch (err) {
            this.logger.error("Error setting ReactionRole", err);
        }

        return rowsModified > 0;
    }

    public removeReactionRole(
        channelId: Snowflake,
        messageId: Snowflake,
        emoteId: string
    ): boolean {
        let rowsModified = 0;

        try {
            const info = this.db
                .prepare(
                    "DELETE FROM ReactionRoles WHERE channelId = ? AND messageId = ? emoteId = ?;"
                )
                .run(channelId, messageId, emoteId);
            rowsModified = info.changes;
        } catch (err) {
            this.logger.error("Error removing ReactionRole", err);
        }

        return rowsModified > 0;
    }
}

export type ReactionRole = {
    channelId: Snowflake;
    messageId: Snowflake;
    emoteId: string;
    roleId: Snowflake;
    guildId: Snowflake;
};
