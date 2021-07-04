import { Snowflake } from "discord.js";
import { PantherBot } from "../Bot";
import { DatabaseEntry, DatabaseObject } from './DatabaseEntry';

export class TwitchClipModConfig extends DatabaseEntry<TwitchClipModObject> {
    private static readonly TABLE = "TwitchClipMod";
    private static readonly DEFAULT_ENTRY: TwitchClipModObject = undefined;

    private clipModConfigCache: Map<Snowflake, TwitchClipModObject>;

    constructor(bot: PantherBot) {
        super(TwitchClipModConfig.TABLE, TwitchClipModConfig.DEFAULT_ENTRY, bot);

        this.clipModConfigCache = new Map<Snowflake, TwitchClipModObject>();
    }

    public async getChannelTwitchClipMod(channelId: Snowflake): Promise<TwitchClipModObject> {
        if (this.clipModConfigCache.has(channelId)) {
            return this.clipModConfigCache.get(channelId)
        }

        //Grab from database
        let clipModConfig: TwitchClipModObject = await this.getDocument(channelId);
        if(!clipModConfig) {
            return(undefined);
        }

        //Cache
        this.clipModConfigCache.set(channelId, clipModConfig);

        return(clipModConfig);
    }

    public async setChannelClipMod(channelId: Snowflake, twitchChannels: string[]): Promise<boolean> {
        let newConfig: TwitchClipModObject = {
            id: channelId,
            twitchChannels: twitchChannels
        }
        if (await this.updateOrInsertDocument(channelId, newConfig)) {
            this.clipModConfigCache.set(channelId, newConfig);
            return true;
        }
        return false;
    }

    public async removeChannelTwitchClipMod(channelId: Snowflake): Promise<TwitchClipModObject> {
        //Check if we have this channel
        let channelClipMod: TwitchClipModObject = await this.getChannelTwitchClipMod(channelId);

        if(!channelClipMod) {
            return(undefined)
        }

        let result: boolean = await this.removeMatchingDocuments(channelClipMod);

        if(result) {
            return(channelClipMod)
        }

        return(undefined);
    }
}

export interface TwitchClipModObject extends DatabaseObject {
    id: string,
    twitchChannels: string[]
}