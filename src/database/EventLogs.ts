import BS3 from 'better-sqlite3';

import Bot from 'Bot';
import { Logger } from 'Logger';

import { Guild, Message, Role, Snowflake } from 'discord.js';

export default class EventLogs {
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
  public getChannel(guildId: Snowflake): Snowflake | null | undefined {
    try {
      const channel: Snowflake | undefined = this.db.prepare(
        'SELECT channelId FROM EventLogs WHERE guildId = ?;'
      ).pluck().get(guildId);
      return channel;
    } catch (err) {
      this.logger.error('Error getting EventLogs from db', err);
      return null;
    }
  }

  public setChannel(guildId: Snowflake, channelId: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO EventLogs(guildId, channelId) '
        + 'VALUES(?, ?) '
        + 'ON CONFLICT(guildId) DO UPDATE SET channelId=excluded.channelId;',
      ).run(guildId, channelId);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error setting EventLog channel', err);
    }

    return rowsModified > 0;
  }

  private generateTable() {
    try {
      const statementInfo = this.db.prepare(
        'CREATE TABLE IF NOT EXISTS EventLogs('
        + '"guildId" TEXT NOT NULL PRIMARY KEY,'
        + '"channelId" TEXT'
        + ');',
      ).run();
      if (statementInfo.changes > 0) {
        this.logger.info('EventLogs table created.');
      }
    } catch (err) {
      this.logger.error('Error creating EventLogs table.', err);
    }
  }
}

type EventLog = {
  guildId: Snowflake;
  channelId: Snowflake | undefined;
};
