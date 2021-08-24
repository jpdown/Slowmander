import { PantherBot } from "Bot";
import { DatabaseEntry, DatabaseObject } from "config/DatabaseEntry";

import { Snowflake } from "discord.js";

export class VerificationConfig extends DatabaseEntry<VerificationConfigObject> {
    private static readonly TABLE: string = "VerificationConfig";
    private static readonly DEFAULT_ENTRY: VerificationConfigObject | undefined = undefined;

    constructor(bot: PantherBot) {
        super(VerificationConfig.TABLE, VerificationConfig.DEFAULT_ENTRY, bot);
    }

    public async getVerificationConfig(guildID: Snowflake): Promise<VerificationConfigObject | undefined> {
        return(await this.getDocument(guildID));
    }

    public async setVerificationConfig(guildID: Snowflake, channelID: Snowflake, messageID: Snowflake, emoteID: Snowflake, roleID: Snowflake, removeReaction: boolean): Promise<boolean> {
        let newConfig: VerificationConfigObject = {
            id: guildID,
            channelID: channelID,
            messageID: messageID,
            emoteID: emoteID,
            roleID: roleID,
            removeReaction: removeReaction
        }
        return(await this.updateOrInsertDocument(guildID, newConfig));
    }
}


export interface VerificationConfigObject extends DatabaseObject {
    id: string,
    channelID: string,
    messageID: string,
    emoteID: string,
    roleID: string,
    removeReaction: boolean
}