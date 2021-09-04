import Bot from 'Bot';
import { DatabaseEntry, DatabaseObject } from 'config/DatabaseEntry';

import { Snowflake } from 'discord.js';

export class VerificationConfig extends DatabaseEntry<VerificationConfigObject> {
  private static readonly TABLE: string = 'VerificationConfig';

  private static readonly DEFAULT_ENTRY: VerificationConfigObject | undefined = undefined;

  constructor(bot: Bot) {
    super(VerificationConfig.TABLE, VerificationConfig.DEFAULT_ENTRY, bot);
  }

  public async getVerificationConfig(guildID: Snowflake): Promise<VerificationConfigObject | undefined> {
    return this.getDocument(guildID);
  }

  public async setVerificationConfig(guildID: Snowflake, channelID: Snowflake, messageID: Snowflake, emoteID: Snowflake, roleID: Snowflake, removeReaction: boolean): Promise<boolean> {
    const newConfig: VerificationConfigObject = {
      id: guildID,
      channelID,
      messageID,
      emoteID,
      roleID,
      removeReaction,
    };
    return this.updateOrInsertDocument(guildID, newConfig);
  }
}

export interface VerificationConfigObject extends DatabaseObject {
  id: string;
  channelID: string;
  messageID: string;
  emoteID: string;
  roleID: string;
  removeReaction: boolean;
}
