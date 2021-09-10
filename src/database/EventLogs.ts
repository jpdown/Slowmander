import type BS3 from 'better-sqlite3';

import type { Bot } from 'Bot';
import { Logger } from 'Logger';

import type {
  Snowflake,
} from 'discord.js';

export class EventLogs {
  private readonly logger: Logger;

  private readonly db: BS3.Database;

  constructor(bot: Bot, db: BS3.Database) {
    this.logger = Logger.getLogger(this);
    this.db = db;
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getChannel(guildId: Snowflake): Snowflake | null | undefined {
    try {
      const channel: Snowflake | undefined = this.db.prepare(
        'SELECT channelId FROM EventLogs WHERE guildId = ?;',
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
}
