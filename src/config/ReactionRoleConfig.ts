import { Message, Emoji, Role, User, GuildMember, TextChannel, Client, NewsChannel, Snowflake, GuildEmoji, ReactionEmoji } from 'discord.js';

import { PantherBot } from "../Bot";
import { LogLevel } from '../Logger';
import { DatabaseEntry, DatabaseObject } from './DatabaseEntry';

export class ReactionRoleConfig extends DatabaseEntry<ReactionRoleObject> {
    private static readonly TABLE = "ReactionRoles";
    private static readonly DEFAULT_ENTRY: ReactionRoleObject = undefined;

    private guildReactionRoleCache: Map<Snowflake, ReactionRoleObject[]>;

    constructor(bot: PantherBot) {
        super(ReactionRoleConfig.TABLE, ReactionRoleConfig.DEFAULT_ENTRY, bot);

        this.guildReactionRoleCache = new Map<Snowflake, ReactionRoleObject[]>();
    }

    public async getGuildReactionRoles(guildId: Snowflake): Promise<ReactionRoleObject[]> {
        if(this.guildReactionRoleCache.has(guildId)) {
            return(this.guildReactionRoleCache.get(guildId));
        }

        //Grab from database
        let reactionRoles: ReactionRoleObject[] = await this.getAllMatches("guildId", guildId);
        if(!reactionRoles) {
            return(undefined);
        }

        //Cache
        this.guildReactionRoleCache.set(guildId, reactionRoles);

        return(reactionRoles);
    }

    public async getFromReaction(message: Message, emoji: GuildEmoji | ReactionEmoji): Promise<ReactionRoleObject> {
        return(await this.getReactionRole({guildID: message.guild.id, messageID: message.id, emoteID: emoji.identifier}));
    }

    public async getReactionRole(filter: ReactionRoleFilter): Promise<ReactionRoleObject> {
        //We can only get from message and emoji id, or by name
        if(!(filter.name || (filter.messageID && filter.emoteID))) return(undefined);

        let guildReactionRoles: ReactionRoleObject[] = await this.getGuildReactionRoles(filter.guildID);

        if(!guildReactionRoles) return(undefined);

        let reactionRole: ReactionRoleObject = undefined;
        for(let currReactionRole of guildReactionRoles) {
            if((filter.messageID && currReactionRole.messageID === filter.messageID && currReactionRole.emoteID === filter.emoteID) //message and emote id match
                || filter.name && currReactionRole.name === filter.name) { //name matches
                    reactionRole = currReactionRole;
                    break;
            }
        }

        return(reactionRole);
    }

    public async getAllReactionRoles(): Promise<Map<Snowflake, ReactionRoleObject[]>> {
        if(this.guildReactionRoleCache.size > 0) return(this.guildReactionRoleCache);

        let reactionRoles = await this.getAllDocuments();
        if(!reactionRoles) return(this.guildReactionRoleCache);

        //Cache
        for(let reactionRole of reactionRoles) {
            if(!this.guildReactionRoleCache.has(reactionRole.guildID)) {
                this.guildReactionRoleCache.set(reactionRole.guildID, []);
            }

            this.guildReactionRoleCache.get(reactionRole.guildID).push(reactionRole);
        }

        return(this.guildReactionRoleCache);
    }

    public async addReactionRole(reactionRole: ReactionRoleObject): Promise<boolean> {
        //Check if guild already has a reaction role with this name
        let guildReactionRoles: ReactionRoleObject[] = await this.getGuildReactionRoles(reactionRole.guildID);

        if(!guildReactionRoles) {
            //We need to make the cache
            this.guildReactionRoleCache.set(reactionRole.guildID, []);
        }
        else {
            for(let currReactionRole of guildReactionRoles) {
                if(reactionRole.name === currReactionRole.name) {
                    return(false);
                }
            }
        }

        //Since it doesn't exist, we're good to add it to database and cache
        let result: boolean = await this.insertDocument(reactionRole);
        if(result) this.guildReactionRoleCache.get(reactionRole.guildID).push(reactionRole);

        return(result);
    }

    public async removeReactionRole(guildId: Snowflake, name: string): Promise<ReactionRoleObject> {
        //Check if we have the reaction role
        let guildReactionRoles: ReactionRoleObject[] = await this.getGuildReactionRoles(guildId);

        if(!guildReactionRoles) {
            return(undefined)
        }

        let reactionRoleToDelete: ReactionRoleObject = undefined;
        for(let reactionRole of guildReactionRoles) {
            if(reactionRole.name === name) {
                reactionRoleToDelete = reactionRole;
                break;
            }
        }

        if(!reactionRoleToDelete) {
            return(undefined);
        }

        let result: boolean = await this.removeMatchingDocuments(reactionRoleToDelete);
        if(result) {
            guildReactionRoles.splice(guildReactionRoles.indexOf(reactionRoleToDelete), 1);
            return(reactionRoleToDelete)
        }

        return(undefined);
    }

    public async guildHasReactionRoleName(guildId: Snowflake, name: string): Promise<boolean> {
        return(await this.getReactionRole({guildID: guildId, name: name}) !== undefined);
    }

    public async guildHasReactionRoleEmote(guildId: Snowflake, emoteID: string, messageID: Snowflake): Promise<boolean> {
        return(await this.getReactionRole({guildID: guildId, emoteID: emoteID, messageID: messageID}) !== undefined);
    }
}

export interface ReactionRoleObject extends DatabaseObject {
    guildID: string,
    channelID: string,
    messageID: string,
    emoteID: string,
    roleID: string,
    name: string
}

interface ReactionRoleFilter {
    guildID: string,
    messageID?: string,
    emoteID?: string,
    name?: string
}