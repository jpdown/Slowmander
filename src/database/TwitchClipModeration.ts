import type BS3 from 'better-sqlite3';

import type Bot from 'Bot';
import { Logger } from 'Logger';

import type { Channel, Snowflake } from 'discord.js';

export default class TwitchClipModeration {
  private readonly logger: Logger;

  private readonly db: BS3.Database;

  constructor(bot: Bot, db: BS3.Database) {
    this.logger = Logger.getLogger(bot, this);
    this.db = db;
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getChannelConfig(channel: Channel): TwitchClipModConfig | null | undefined {
    try {
      const row: TwitchClipModConfig | undefined = this.db.prepare('SELECT * FROM TwitchClipModConfigs WHERE channelId = ?;').get(channel.id);
      return row;
    } catch (err) {
      this.logger.error('Error getting TwitchClipModConfigs from db', err);
      return null;
    }
  }

  /**
   * @returns Empty array when none found, null on db error
   */
  public getApprovedChannels(channel: Channel): string[] | null {
    try {
      const rows: string[] = this.db.prepare(
        'SELECT twitchChannel FROM TwitchClipApprovedChannels WHERE channelId = ?;',
      ).pluck().all(channel.id);
      return rows;
    } catch (err) {
      this.logger.error('Error getting TwitchClipApprovedChannels from db', err);
      return null;
    }
  }

  public enable(channel: Channel): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO TwitchClipModConfigs(channelId,enabled) VALUES(?, 1)'
        + 'ON CONFLICT(channelId) DO UPDATE SET enabled=excluded.enabled;',
      ).run(channel.id);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error enabling TwitchClipModConfigs in db', err);
    }

    return rowsModified > 0;
  }

  public disable(channel: Channel): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO TwitchClipModConfigs(channelId,enabled) VALUES(?, 0)'
        + 'ON CONFLICT(channelId) DO UPDATE SET enabled=excluded.enabled;',
      ).run(channel.id);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error disabling TwitchClipModConfigs in db', err);
    }

    return rowsModified > 0;
  }

  public enableApprovedOnly(channel: Channel): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO TwitchClipModConfigs(channelId,approvedOnly) VALUES(?, 1)'
        + 'ON CONFLICT(channelId) DO UPDATE SET approvedOnly=excluded.approvedOnly;',
      ).run(channel.id);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error enabling approvedOnly TwitchClipModConfigs in db', err);
    }

    return rowsModified > 0;
  }

  public disableApprovedOnly(channel: Channel): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO TwitchClipModConfigs(channelId,approvedOnly) VALUES(?, 0)'
        + 'ON CONFLICT(channelId) DO UPDATE SET approvedOnly=excluded.approvedOnly;',
      ).run(channel.id);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error disabling approvedOnly TwitchClipModConfigs in db', err);
    }

    return rowsModified > 0;
  }

  public addApprovedChannel(channel: Channel, twitchChannel: string): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT OR IGNORE INTO TwitchClipApprovedChannels(channelId,twitchChannel) VALUES(?, ?);',
      ).run(channel.id, twitchChannel);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error adding TwitchClipApprovedChannel in db', err);
    }

    return rowsModified > 0;
  }

  public removeApprovedChannel(channel: Channel, twitchChannel: string): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'DELETE FROM TwitchClipApprovedChannels WHERE channelId = ? AND twitchChannel = ?;',
      ).run(channel.id, twitchChannel);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error removing TwitchClipApprovedChannel in db', err);
    }

    return rowsModified > 0;
  }
}

export type TwitchClipModConfig = {
  channelId: Snowflake;
  enabled: boolean;
  approvedOnly: boolean;
};
