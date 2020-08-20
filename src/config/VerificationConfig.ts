import { PantherBot } from "../Bot";
import { Snowflake } from "discord.js";
import { DatabaseEntry, DatabaseObject } from "./DatabaseEntry";

export class LockdownConfig extends DatabaseEntry<VerificationConfigObject> {
    private static readonly TABLE: string = "VerificationConfig";
    private static readonly DEFAULT_ENTRY: VerificationConfigObject = undefined;

    constructor(bot: PantherBot) {
        super(LockdownConfig.TABLE, LockdownConfig.DEFAULT_ENTRY, bot);
    }

    public async getVerificationConfig(guildID: Snowflake): Promise<VerificationConfigObject> {
        return(await this.getDocument(guildID));
    }

    public async setVerificationConfig(guildID: Snowflake, channelID: Snowflake, messageID: Snowflake, emoteID: Snowflake, roleID: Snowflake): Promise<boolean> {
        let newConfig: VerificationConfigObject = {
            id: guildID,
            channelID: channelID,
            messageID: messageID,
            emoteID: emoteID,
            roleID: roleID
        }
        return(await this.updateOrInsertDocument(guildID, newConfig));
    }
}


export interface VerificationConfigObject extends DatabaseObject {
    id: string,
    channelID: string,
    messageID: string,
    emoteID: string,
    roleID: string
}