import BS3 from 'better-sqlite3';

import Bot from 'Bot';
import { Logger } from 'Logger';

import { Message, Role, Snowflake } from 'discord.js';

export default class Verification {
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
  public getConfig(guildId: Snowflake): VerificationConfig | null | undefined {
    try {
      const row: VerificationConfig | undefined = this.db.prepare('SELECT * FROM VerificationConfigs WHERE guildId = ?;').get(guildId);
      return row;
    } catch (err) {
      this.logger.error('Error getting VerificationConfig from db', err);
      return null;
    }
  }

  public enable(guildId: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'UPDATE VerificationConfigs SET enabled = 1 WHERE guildId = ?;'
      ).run(guildId);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error enabling VerificationConfig in db', err);
    }

    return rowsModified > 0;
  }

  public disable(guildId: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'UPDATE VerificationConfigs SET enabled = 0 WHERE guildId = ?;'
      ).run(guildId);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error disabling VerificationConfig in db', err);
    }

    return rowsModified > 0;
  }

  public enableRemoveReaction(guildId: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'UPDATE VerificationConfigs SET removeReaction = 1 WHERE guildId = ?;'
      ).run(guildId);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error enabling removeReaction VerificationConfig db', err);
    }

    return rowsModified > 0;
  }

  public disableRemoveReaction(guildId: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'UPDATE VerificationConfigs SET removeReaction = 0 WHERE guildId = ?;'
      ).run(guildId);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error disabling removeReaction VerificationConfig db', err);
    }

    return rowsModified > 0;
  }

  public setConfig(message: Message, role: Role, emoteId: string): boolean {
    let rowsModified = 0;

    if (message.guild?.id !== role.id) {
        return false;
    }

    try {
      const info = this.db.prepare(
        'INSERT INTO VerificationConfigs(guildId, channelId, messageId, emoteId, roleId) '
        + 'VALUES(?, ?, ?, ?, ?) '
        + 'ON CONFLICT(guildId) DO UPDATE SET '
        + 'channelId=excluded.channelId, messageId=excluded.messageId,'
        + 'emoteId=excluded.emoteId, roleId=excluded.roleId;',
      ).run(message.guild.id, message.channel.id, message.id, emoteId, role.id);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error setting VerificationConfig in db', err);
    }

    return rowsModified > 0;
  }

  private generateTable() {
    try {
      const statementInfo = this.db.prepare(
        'CREATE TABLE IF NOT EXISTS VerificationConfigs('
        + '"guildId" TEXT NOT NULL PRIMARY KEY,'
        + '"enabled" BOOLEAN NOT NULL DEFAULT 0 CHECK (enabled in (0, 1)),'
        + '"channelId" TEXT NOT NULL,'
        + '"messageId" TEXT NOT NULL,'
        + '"emoteId" TEXT NOT NULL,'
        + '"roleId" TEXT NOT NULL,'
        + '"removeReaction" BOOLEAN NOT NULL DEFAULT 0 CHECK (removeReaction in (0, 1))'
        + ');',
      ).run();
      if (statementInfo.changes > 0) {
        this.logger.info('VerificationConfigs table created.');
      }
    } catch (err) {
      this.logger.error('Error creating Verification table.', err);
    }
  }
}

export type VerificationConfig = {
  guildId: Snowflake;
  enabled: boolean;
  channelId: Snowflake;
  messageId: Snowflake;
  emoteId: string;
  roleId: Snowflake;
  removeReaction: boolean;
};
