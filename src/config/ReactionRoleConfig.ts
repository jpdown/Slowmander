import { Bot } from 'Bot';
import { DatabaseEntry, DatabaseObject } from 'config/DatabaseEntry';

import {
  Message, Snowflake, GuildEmoji, ReactionEmoji,
} from 'discord.js';

export class ReactionRoleConfig extends DatabaseEntry<ReactionRoleObject> {
  private static readonly TABLE = 'ReactionRoles';

  private static readonly DEFAULT_ENTRY: ReactionRoleObject | undefined = undefined;

  private guildReactionRoleCache: Map<Snowflake, ReactionRoleObject[]>;

  constructor(bot: Bot) {
    super(ReactionRoleConfig.TABLE, ReactionRoleConfig.DEFAULT_ENTRY, bot);

    this.guildReactionRoleCache = new Map<Snowflake, ReactionRoleObject[]>();
  }

  public async getGuildReactionRoles(guildId: Snowflake): Promise<ReactionRoleObject[] | undefined> {
    if (this.guildReactionRoleCache.has(guildId)) {
      return this.guildReactionRoleCache.get(guildId);
    }

    // Grab from database
    const reactionRoles: ReactionRoleObject[] | undefined = await this.getAllMatches('guildId', guildId);
    if (!reactionRoles) {
      return undefined;
    }

    // Cache
    this.guildReactionRoleCache.set(guildId, reactionRoles);

    return reactionRoles;
  }

  public async getFromReaction(message: Message, emoji: GuildEmoji | ReactionEmoji): Promise<ReactionRoleObject | undefined> {
    if (!message.guild) return undefined;
    return this.getReactionRole({ guildID: message.guild.id, messageID: message.id, emoteID: emoji.identifier });
  }

  public async getReactionRole(filter: ReactionRoleFilter): Promise<ReactionRoleObject | undefined> {
    // We can only get from message and emoji id, or by name
    if (!(filter.name || (filter.messageID && filter.emoteID))) return undefined;

    const guildReactionRoles: ReactionRoleObject[] | undefined = await this.getGuildReactionRoles(filter.guildID);

    if (!guildReactionRoles) return undefined;

    let reactionRole: ReactionRoleObject | undefined;
    for (const currReactionRole of guildReactionRoles) {
      if ((filter.messageID && currReactionRole.messageID === filter.messageID && currReactionRole.emoteID === filter.emoteID) // message and emote id match
                || filter.name && currReactionRole.name === filter.name) { // name matches
        reactionRole = currReactionRole;
        break;
      }
    }

    return reactionRole;
  }

  public async getAllReactionRoles(): Promise<Map<Snowflake, ReactionRoleObject[]>> {
    if (this.guildReactionRoleCache.size > 0) return this.guildReactionRoleCache;

    const reactionRoles = await this.getAllDocuments();
    if (!reactionRoles) return this.guildReactionRoleCache;

    // Cache
    for (const reactionRole of reactionRoles) {
      if (!this.guildReactionRoleCache.has(reactionRole.guildID)) {
        this.guildReactionRoleCache.set(reactionRole.guildID, []);
      }

      this.guildReactionRoleCache.get(reactionRole.guildID)?.push(reactionRole);
    }

    return this.guildReactionRoleCache;
  }

  public async addReactionRole(reactionRole: ReactionRoleObject): Promise<boolean> {
    // Check if guild already has a reaction role with this name
    const guildReactionRoles: ReactionRoleObject[] | undefined = await this.getGuildReactionRoles(reactionRole.guildID);

    if (!guildReactionRoles) {
      // We need to make the cache
      this.guildReactionRoleCache.set(reactionRole.guildID, []);
    } else {
      for (const currReactionRole of guildReactionRoles) {
        if (reactionRole.name === currReactionRole.name) {
          return false;
        }
      }
    }

    // Since it doesn't exist, we're good to add it to database and cache
    const result: boolean = await this.insertDocument(reactionRole);
    if (result) this.guildReactionRoleCache.get(reactionRole.guildID)?.push(reactionRole);

    return result;
  }

  public async removeReactionRole(guildId: Snowflake, name: string): Promise<ReactionRoleObject | undefined> {
    // Check if we have the reaction role
    const guildReactionRoles: ReactionRoleObject[] | undefined = await this.getGuildReactionRoles(guildId);

    if (!guildReactionRoles) {
      return undefined;
    }

    let reactionRoleToDelete: ReactionRoleObject | undefined;
    for (const reactionRole of guildReactionRoles) {
      if (reactionRole.name === name) {
        reactionRoleToDelete = reactionRole;
        break;
      }
    }

    if (!reactionRoleToDelete) {
      return undefined;
    }

    const result: boolean = await this.removeMatchingDocuments(reactionRoleToDelete);
    if (result) {
      guildReactionRoles.splice(guildReactionRoles.indexOf(reactionRoleToDelete), 1);
      return reactionRoleToDelete;
    }

    return undefined;
  }

  public async guildHasReactionRoleName(guildId: Snowflake, name: string): Promise<boolean> {
    return await this.getReactionRole({ guildID: guildId, name }) !== undefined;
  }

  public async guildHasReactionRoleEmote(guildId: Snowflake, emoteID: string, messageID: Snowflake): Promise<boolean> {
    return await this.getReactionRole({ guildID: guildId, emoteID, messageID }) !== undefined;
  }
}

export interface ReactionRoleObject extends DatabaseObject {
  guildID: string;
  channelID: string;
  messageID: string;
  emoteID: string;
  roleID: string;
  name: string;
}

interface ReactionRoleFilter {
  guildID: string;
  messageID?: string;
  emoteID?: string;
  name?: string;
}
