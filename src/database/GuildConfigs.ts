import BS3 from 'better-sqlite3';

import Bot from 'Bot';
import { Logger } from 'Logger';

import { Snowflake } from 'discord.js';

export default class GuildConfigs {
  private readonly logger: Logger;

  private readonly db: BS3.Database;

  constructor(bot: Bot, db: BS3.Database) {
    this.logger = Logger.getLogger(bot, this);
    this.db = db;
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getPrefix(guildId: Snowflake): string | null | undefined {
    try {
      const row: GuildConfig | undefined = this.db.prepare('SELECT prefix FROM GuildConfigs WHERE guildId = ?;').get(guildId);
      return row?.prefix;
    } catch (err) {
      this.logger.error('Error getting GuildConfig from db', err);
      return null;
    }
  }

  public setPrefix(guildId: Snowflake, prefix: string): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO GuildConfigs(guildId,prefix) VALUES(?, ?)'
        + 'ON CONFLICT(guildId) DO UPDATE SET prefix=excluded.prefix;',
      ).run(guildId, prefix);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error setting GuildConfig prefix', err);
    }

    return rowsModified > 0;
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getVipRole(guildId: Snowflake): Snowflake | null | undefined {
    try {
      const row: GuildConfig | undefined = this.db.prepare('SELECT vipRole FROM GuildConfigs WHERE guildId = ?;').get(guildId);
      return row?.vipRole;
    } catch (err) {
      this.logger.error('Error getting GuildConfig from db', err);
      return null;
    }
  }

  public setVipRole(guildId: Snowflake, vipRole: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO GuildConfigs(guildId,vipRole) VALUES(?, ?)'
        + 'ON CONFLICT(guildId) DO UPDATE SET vipRole=excluded.vipRole;',
      ).run(guildId, vipRole);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error setting GuildConfig vipRole', err);
    }

    return rowsModified > 0;
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getModRole(guildId: Snowflake): Snowflake | null | undefined {
    try {
      const row: GuildConfig | undefined = this.db.prepare('SELECT modRole FROM GuildConfigs WHERE guildId = ?;').get(guildId);
      return row?.modRole;
    } catch (err) {
      this.logger.error('Error getting GuildConfig from db', err);
      return null;
    }
  }

  public setModRole(guildId: Snowflake, modRole: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO GuildConfigs(guildId,modRole) VALUES(?, ?)'
        + 'ON CONFLICT(guildId) DO UPDATE SET modRole=excluded.modRole;',
      ).run(guildId, modRole);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error setting GuildConfig modRole', err);
    }

    return rowsModified > 0;
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getAdminRole(guildId: Snowflake): Snowflake | null | undefined {
    try {
      const row: GuildConfig | undefined = this.db.prepare('SELECT adminRole FROM GuildConfigs WHERE guildId = ?;').get(guildId);
      return row?.adminRole;
    } catch (err) {
      this.logger.error('Error getting GuildConfig from db', err);
      return null;
    }
  }

  public setAdminRole(guildId: Snowflake, adminRole: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO GuildConfigs(guildId,adminRole) VALUES(?, ?)'
        + 'ON CONFLICT(guildId) DO UPDATE SET adminRole=excluded.adminRole;',
      ).run(guildId, adminRole);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error setting GuildConfig adminRole', err);
    }

    return rowsModified > 0;
  }

  /**
   * @returns undefined when not found, null on db error
   */
  public getModChannel(guildId: Snowflake): Snowflake | null | undefined {
    try {
      const row: GuildConfig | undefined = this.db.prepare('SELECT modChannel FROM GuildConfigs WHERE guildId = ?;').get(guildId);
      return row?.modChannel;
    } catch (err) {
      this.logger.error('Error getting GuildConfig from db', err);
      return null;
    }
  }

  public setModChannel(guildId: Snowflake, modChannel: Snowflake): boolean {
    let rowsModified = 0;

    try {
      const info = this.db.prepare(
        'INSERT INTO GuildConfigs(guildId,modChannel) VALUES(?, ?) '
        + 'ON CONFLICT(guildId) DO UPDATE SET modChannel=excluded.modChannel;',
      ).run(guildId, modChannel);
      rowsModified = info.changes;
    } catch (err) {
      this.logger.error('Error setting GuildConfig modChannel', err);
    }

    return rowsModified > 0;
  }
}

type GuildConfig = {
  guildId: Snowflake;
  prefix: string | null | undefined;
  vipRole: Snowflake | null | undefined;
  modRole: Snowflake | null | undefined;
  adminRole: Snowflake | null | undefined;
  modChannel: Snowflake | null | undefined;
};
