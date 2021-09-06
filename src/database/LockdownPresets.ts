import BS3 from 'better-sqlite3';

import Bot from 'Bot';
import { Logger } from 'Logger';

import { Snowflake } from 'discord.js';

export default class LockdownPresets {
  private readonly logger: Logger;

  private readonly db: BS3.Database;

  constructor(bot: Bot, db: BS3.Database) {
    this.logger = Logger.getLogger(bot, this);
    this.db = db;
  }

  /**
   * @returns Empty array when none found, null on db error
   */
  public getPresetList(guildId: Snowflake): string[] | null {
    try {
      const rows: string[] = this.db.prepare('SELECT preset FROM LockdownPresets WHERE guildId = ?;').pluck().all(guildId);
      return rows;
    } catch (err) {
      this.logger.error('Error getting LockdownPresets from db', err);
      return null;
    }
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getPreset(guildId: Snowflake, preset: string): LockdownPreset | null | undefined {
    try {
      const row: LockdownPreset = this.db.prepare('SELECT * FROM LockdownPresets WHERE guildId = ? AND preset = ?;').get(guildId, preset);
      return row;
    } catch (err) {
      this.logger.error('Error getting LockdownPreset from db', err);
      return null;
    }
  }

  /**
   * @returns Empty array when none found, null on db error
   */
  public getPresetChannels(guildId: Snowflake, preset: string): Snowflake[] | null {
    try {
      const rows: string[] = this.db.prepare('SELECT channelId FROM LockdownChannels WHERE guildId = ? AND preset = ?;').pluck().all(guildId, preset);
      return rows;
    } catch (err) {
      this.logger.error('Error getting LockdownChannels from db', err);
      return null;
    }
  }

  /**
   * @returns Empty array when none found, null on db error
   */
  public getPresetRoles(guildId: Snowflake, preset: string): Snowflake[] | null {
    try {
      const rows: string[] = this.db.prepare('SELECT roleId FROM LockdownRoles WHERE guildId = ? AND preset = ?;').pluck().all(guildId, preset);
      return rows;
    } catch (err) {
      this.logger.error('Error getting LockdownRoles from db', err);
      return null;
    }
  }

  public setPreset(guildId: Snowflake, preset: string, grant: boolean, channels: Snowflake[], roles: Snowflake[]): boolean {
    let rowsModified = 0;

    try {
      // Begin a transaction
      this.db.prepare('BEGIN;').run();

      // Delete old channels and roles
      let info = this.db.prepare(
        'DELETE FROM LockdownChannels WHERE guildId = ? AND preset = ?;'
      ).run(guildId, preset);
      rowsModified += info.changes;
      
      info = this.db.prepare(
        'DELETE FROM LockdownRoles WHERE guildId = ? AND preset = ?;'
      ).run(guildId, preset);
      rowsModified += info.changes;

      // Upsert preset
      info = this.db.prepare(
        'INSERT INTO LockdownPresets(guildId,preset,grant) VALUES(?, ?, ?)'
        + 'ON CONFLICT(guildId, preset) DO UPDATE SET grant=excluded.grant;',
      ).run(guildId, preset, grant ? 1 : 0);
      rowsModified += info.changes;

      // Insert channels
      channels.forEach((channel) => {
        info = this.db.prepare(
          'INSERT INTO LockdownChannels(guildId, preset, channelId) VALUES(?, ?, ?);'
        ).run(guildId, preset, channel);
        rowsModified += info.changes;
      });

      // Insert roles
      roles.forEach((role) => {
        info = this.db.prepare(
          'INSERT INTO LockdownRoles(guildId, preset, roleId) VALUES(?, ?, ?);'
        ).run(guildId, preset, role);
        rowsModified += info.changes;
      });

      // Commit transaction
      this.db.prepare('COMMIT;').run();
    } catch (err) {
      this.db.prepare("ROLLBACK;").run();
      rowsModified = 0;
      this.logger.error('Error setting LockdownPreset', err);
    }

    return rowsModified > 0;
  }

  public removePreset(guildId: Snowflake, preset: string): boolean {
    let rowsModified = 0;

    try {
      // Begin transaction
      this.db.prepare('BEGIN;').run();

      // Remove channels
      let info = this.db.prepare('DELETE FROM LockdownChannels WHERE guildId = ? AND preset = ?;').run();
      rowsModified += info.changes;

      // Remove roles
      info = this.db.prepare('DELETE FROM LockdownRoles WHERE guildId = ? AND preset = ?;').run();
      rowsModified += info.changes;

      // Remove preset
      info = this.db.prepare('DELETE FROM LockdownPresets WHERE guildId = ? AND preset = ?;').run();
      rowsModified += info.changes;

      // Commit
      this.db.prepare('COMMIT;').run();
    } catch (err) {
      this.db.prepare("ROLLBACK;").run();
      rowsModified = 0;
      this.logger.error('Error removing LockdownPreset', err);
    }

    return rowsModified > 0;
  }
}

export type LockdownPreset = {
  guildId: Snowflake;
  preset: string;
  grant: boolean;
};

type LockdownChannel = {
  guildId: Snowflake;
  preset: string;
  channelId: Snowflake;
}

type LockdownRole = {
  guildId: Snowflake;
  preset: string;
  roleId: Snowflake;
}