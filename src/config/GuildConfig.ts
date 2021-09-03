import { Bot } from 'Bot';
import { DatabaseEntry, DatabaseObject } from 'config/DatabaseEntry';

import { Snowflake } from 'discord.js';

export class GuildConfig extends DatabaseEntry<GuildConfigObject> {
  private static readonly TABLE: string = 'GuildConfig';

  private static readonly DEFAULT_ENTRY: GuildConfigObject | undefined = undefined;

  constructor(bot: Bot) {
    super(GuildConfig.TABLE, GuildConfig.DEFAULT_ENTRY, bot);
  }

  public async getPrefix(guildId: Snowflake): Promise<string | undefined> {
    const gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

    if (gc) {
      return gc.prefix;
    }

    return undefined;
  }

  public async setPrefix(guildId: Snowflake, newPrefix: string): Promise<boolean> {
    return this.updateOrInsertDocument(guildId, { prefix: newPrefix });
  }

  public async getEventlogChannel(guildId: Snowflake): Promise<string | undefined> {
    const gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

    if (gc) {
      return gc.eventlogChannel;
    }

    return undefined;
  }

  public async setEventlogChannel(guildId: Snowflake, newChannel: string): Promise<boolean> {
    return this.updateOrInsertDocument(guildId, { eventlogChannel: newChannel });
  }

  public async getVipRole(guildId: Snowflake): Promise<string | undefined> {
    const gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

    if (gc) {
      return gc.vipRole;
    }

    return undefined;
  }

  public async setVipRole(guildId: Snowflake, newVipRole: string): Promise<boolean> {
    return this.updateOrInsertDocument(guildId, { vipRole: newVipRole });
  }

  public async getModRole(guildId: Snowflake): Promise<string | undefined> {
    const gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

    if (gc) {
      return gc.modRole;
    }

    return undefined;
  }

  public async setModRole(guildId: Snowflake, newModRole: string): Promise<boolean> {
    return this.updateOrInsertDocument(guildId, { modRole: newModRole });
  }

  public async getAdminRole(guildId: Snowflake): Promise<string | undefined> {
    const gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

    if (gc) {
      return gc.adminRole;
    }

    return undefined;
  }

  public async setAdminRole(guildId: Snowflake, newAdminRole: string): Promise<boolean> {
    return this.updateOrInsertDocument(guildId, { adminRole: newAdminRole });
  }

  public async getModErrorChannel(guildId: Snowflake): Promise<string | undefined> {
    const gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

    if (gc) {
      return gc.modErrorChannel;
    }

    return undefined;
  }

  public async setModErrorChannel(guildId: Snowflake, newModErrorChannel: string): Promise<boolean> {
    return this.updateOrInsertDocument(guildId, { modErrorChannel: newModErrorChannel });
  }

  public async getVerificationEnabled(guildId: Snowflake): Promise<boolean | undefined> {
    const gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

    if (gc) {
      return gc.verificationEnabled;
    }

    return undefined;
  }

  public async setVerificationEnabled(guildId: Snowflake, newVerificationEnabled: boolean): Promise<boolean> {
    return this.updateOrInsertDocument(guildId, { verificationEnabled: newVerificationEnabled });
  }

  private async getGuildConfigObject(guildId: string): Promise<GuildConfigObject> {
    return <GuildConfigObject> await this.getDocument(guildId);
  }
}

interface GuildConfigObject extends DatabaseObject {
  id?: string;
  prefix?: string;
  eventlogChannel?: string;
  vipRole?: string;
  modRole?: string;
  adminRole?: string;
  verificationEnabled?: boolean;
  modErrorChannel?: string;
}
