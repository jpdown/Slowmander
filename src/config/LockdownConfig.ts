import { Bot } from "Bot";
import { DatabaseEntry, DatabaseObject } from "config/DatabaseEntry";

import { Snowflake } from "discord.js";

export class LockdownConfig extends DatabaseEntry<LockdownConfigObject> {
    private static readonly TABLE: string = "LockdownConfig";
    private static readonly DEFAULT_ENTRY: LockdownConfigObject | undefined = undefined;

    constructor(bot: Bot) {
        super(LockdownConfig.TABLE, LockdownConfig.DEFAULT_ENTRY, bot);
    }

    public async getAllLockdownPresets(guildId: Snowflake): Promise<LockdownConfigObject[] | undefined> {
        let presets: LockdownConfigObject[] | undefined = await this.getAllMatches("guildID", guildId);

        if(presets) {
            return(presets);
        }
        
        return(undefined);
    }

    public async getLockdownPreset(guildId: Snowflake, name: string): Promise<LockdownConfigObject | undefined> {
        let guildPresets: LockdownConfigObject[] | undefined = await this.getAllLockdownPresets(guildId);

        if(!guildPresets) {
            return(undefined);
        }

        let matchingPreset: LockdownConfigObject | undefined = undefined;
        for(let preset of guildPresets) {
            if(preset.name === name) {
                matchingPreset = preset;
                break;
            }
        }

        return(matchingPreset);
    }

    public async setLockdownPreset(preset: LockdownConfigObject): Promise<boolean> {
        //Decide if we're updating or inserting
        let existingPreset: LockdownConfigObject | undefined = await this.getLockdownPreset(preset.guildID, preset.name);
        if(existingPreset) {
            return(await this.updateDocument(existingPreset.id, preset));
        }
        else {
            return(await this.insertDocument(preset));
        }
    }

    public async removeLockdownPreset(guildId: Snowflake, name: string): Promise<boolean> {
        //See if preset exists
        let existingPreset: LockdownConfigObject | undefined = await this.getLockdownPreset(guildId, name);
        if(existingPreset) {
            return(await this.removeMatchingDocuments(existingPreset));
        }
        else {
            return(false);
        }
    }
}


export interface LockdownConfigObject extends DatabaseObject {
    guildID: string,
    channelIDs: string[],
    roleIDs: string[],
    grant: boolean,
    name: string
}