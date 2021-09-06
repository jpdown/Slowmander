import BS3 from 'better-sqlite3';

import Bot from 'Bot';
import { Logger } from 'Logger';

import { Guild, Message, Role, Snowflake } from 'discord.js';

export default class ReactionRoles {
  private readonly logger: Logger;

  private readonly db: BS3.Database;

  constructor(bot: Bot, db: BS3.Database) {
    this.logger = Logger.getLogger(bot, this);
    this.db = db;

    this.generateTable();
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getReactionRole(message: Message, emoteId: string): ReactionRole | null | undefined {
    try {
      const row: ReactionRole | undefined = this.db.prepare(
        'SELECT * FROM ReactionRoles WHERE channelId = ? AND messageId = ? AND emoteId = ?;'
      ).get(message.channel.id, message.id, emoteId);
      return row;
    } catch (err) {
      this.logger.error('Error getting ReactionRoles from db', err);
      return null;
    }
  }

  /**
   * @returns Empty array when none found, null on db error
   */
  public getReactionRolesByMessage(message: Message): ReactionRole[] | null {
    try {
      const rows: ReactionRole[] = this.db.prepare(
        'SELECT * FROM ReactionRoles WHERE channelId = ? AND messageId = ?;'
      ).all(message.channel.id, message.id);
      return rows;
    } catch (err) {
      this.logger.error('Error getting ReactionRoles from db', err);
      return null;
    }
  }

  /**
   * @returns Empty array when none found, null on db error
   */
  public getReactionRolesByGuild(guild: Guild): ReactionRole[] | null {
    try {
      const rows: ReactionRole[] = this.db.prepare('SELECT * FROM ReactionRoles WHERE guildId = ?;').all(guild.id);
      return rows;
    } catch (err) {
      this.logger.error('Error getting ReactionRoles from db', err);
      return null;
    }
  }

  public setReactionRole(message: Message, emoteId: string, role: Role): boolean {
    let rowsModified = 0;

    if (message.guild?.id !== role.guild.id) {
      return false;
    }

    try {
      const info = this.db.prepare(
        'INSERT INTO ReactionRoles(channelId, messageId, emoteId, roleId, guildId) '
        + 'VALUES(?, ?, ?, ?, ?) '
        + 'ON CONFLICT(channelId, messageId, emoteId) DO UPDATE SET roleId=excluded.roleId;',
      ).run(message.channel.id, message.id, emoteId, role.id, message.guild.id);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error setting ReactionRole', err);
    }

    return rowsModified > 0;
  }

  public removeReactionRole(channelId: Snowflake, messageId: Snowflake, emoteId: string): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'DELETE FROM ReactionRoles WHERE channelId = ? AND messageId = ? emoteId = ?;'
      ).run(channelId, messageId, emoteId);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error removing ReactionRole', err);
    }

    return rowsModified > 0;
  }

  private generateTable() {
    try {
      const statementInfo = this.db.prepare(
        'CREATE TABLE IF NOT EXISTS ReactionRoles('
        + '"channelId" TEXT NOT NULL,'
        + '"messageId" TEXT NOT NULL,'
        + '"emoteId" TEXT NOT NULL,'
        + '"roleId" TEXT NOT NULL,'
        + '"guildId" TEXT NOT NULL,'
        + 'PRIMARY KEY(channelId, messageId, emoteId)'
        + ');',
      ).run();
      if (statementInfo.changes > 0) {
        this.logger.info('ReactionRoles table created.');
      }
    } catch (err) {
      this.logger.error('Error creating ReactionRoles table.', err);
    }
  }
}

export type ReactionRole = {
  channelId: Snowflake;
  messageId: Snowflake;
  emoteId: string;
  roleId: Snowflake;
  guildId: Snowflake;
};
