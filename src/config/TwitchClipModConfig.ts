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

    public async enableChannelTwitchClipMod(channelId: Snowflake): Promise<boolean> {
        let newConfig: TwitchClipModObject = {
            id: channelId,
            enabled: true
        }
        if (await this.updateOrInsertDocument(channelId, newConfig)) {
            this.clipModConfigCache.set(channelId, await this.getDocument(channelId));
            return true;
        }
        return false;
    }

    public async disableChannelTwitchClipMod(channelId: Snowflake): Promise<boolean> {
        let newConfig: TwitchClipModObject = {
            id: channelId,
            enabled: false
        }
        if (await this.updateOrInsertDocument(channelId, newConfig)) {
            this.clipModConfigCache.set(channelId, await this.getDocument(channelId));
            return true;
        }
        return false;
    }

    public async enableApprovedChannels(channelId: Snowflake): Promise<boolean> {
        let newConfig: TwitchClipModObject = {
            id: channelId,
            approvedChannelsOnly: true
        }
        if (await this.updateOrInsertDocument(channelId, newConfig)) {
            this.clipModConfigCache.set(channelId, await this.getDocument(channelId));
            return true;
        }
        return false;
    }

    public async disableApprovedChannels(channelId: Snowflake): Promise<boolean> {
        let newConfig: TwitchClipModObject = {
            id: channelId,
            approvedChannelsOnly: false
        }
        if (await this.updateOrInsertDocument(channelId, newConfig)) {
            this.clipModConfigCache.set(channelId, await this.getDocument(channelId));
            return true;
        }
        return false;
    }

    public async addApprovedChannel(channelId: Snowflake, twitchChannelId: string): Promise<boolean> {
        let currConfig: TwitchClipModObject = await this.getChannelTwitchClipMod(channelId);
        let newConfig: TwitchClipModObject = {
            id: channelId
        }

        if (currConfig.twitchChannels === undefined) {
            newConfig.twitchChannels = [];
        }
        else {
            newConfig.twitchChannels = currConfig.twitchChannels;
        }

        if (newConfig.twitchChannels.includes(twitchChannelId)) {
            return false;
        }

        newConfig.twitchChannels.push(twitchChannelId);

        if (await this.updateOrInsertDocument(channelId, newConfig)) {
            this.clipModConfigCache.set(channelId, await this.getDocument(channelId));
            return true;
        }
        return false;
    }

    public async removeApprovedChannel(channelId: Snowflake, twitchChannelId: string): Promise<boolean> {
        let currConfig: TwitchClipModObject = await this.getChannelTwitchClipMod(channelId);
        let newConfig: TwitchClipModObject = {
            id: channelId
        }

        if (currConfig.twitchChannels === undefined) {
            return false;
        }
        else {
            newConfig.twitchChannels = currConfig.twitchChannels;
        }

        if (!newConfig.twitchChannels.includes(twitchChannelId)) {
            return false;
        }

        newConfig.twitchChannels.splice(newConfig.twitchChannels.indexOf(twitchChannelId), 1)

        if (await this.updateOrInsertDocument(channelId, newConfig)) {
            this.clipModConfigCache.set(channelId, await this.getDocument(channelId));
            return true;
        }
        return false;
    }
}

export interface TwitchClipModObject extends DatabaseObject {
    id: string,
    enabled?: boolean,
    approvedChannelsOnly?: boolean,
    twitchChannels?: string[]
}