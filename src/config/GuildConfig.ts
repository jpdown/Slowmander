import { PantherBot } from "../Bot";
import { Snowflake } from "discord.js";
import { DatabaseEntry } from "./DatabaseEntry";

export class GuildConfig extends DatabaseEntry<GuildConfigObject> {
    private static readonly TABLE: string = "GuildConfig";
    private static readonly DEFAULT_ENTRY: GuildConfigObject = undefined;

    constructor(bot: PantherBot) {
        super(GuildConfig.TABLE, GuildConfig.DEFAULT_ENTRY, bot);
    }

    public async getPrefix(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.prefix);
        }

        return(undefined);
    }

    public async setPrefix(guildId: Snowflake, newPrefix: string): Promise<boolean> {
        return(await this.updateOrInsertDocument(guildId, {prefix: newPrefix}));
    }

    public async getEventlogChannel(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.eventlogChannel);
        }

        return(undefined);
    }

    public async setEventlogChannel(guildId: Snowflake, newChannel: string): Promise<boolean> {
        return(await this.updateOrInsertDocument(guildId, {eventlogChannel: newChannel}));
    }

    public async getVipRole(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.vipRole);
        }

        return(undefined);
    }

    public async setVipRole(guildId: Snowflake, newVipRole: string): Promise<boolean> {
        return(await this.updateOrInsertDocument(guildId, {vipRole: newVipRole}));
    }

    public async getModRole(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.modRole);
        }

        return(undefined);
    }

    public async setModRole(guildId: Snowflake, newModRole: string): Promise<boolean> {
        return(await this.updateOrInsertDocument(guildId, {modRole: newModRole}));
    }

    public async getAdminRole(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.adminRole);
        }

        return(undefined);
    }

    public async setAdminRole(guildId: Snowflake, newAdminRole: string): Promise<boolean> {
        return(await this.updateOrInsertDocument(guildId, {adminRole: newAdminRole}));
    }

    public async getModErrorChannel(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.modErrorChannel);
        }

        return(undefined);
    }

    public async setModErrorChannel(guildId: Snowflake, newModErrorChannel: string): Promise<boolean> {
        return(await this.updateOrInsertDocument(guildId, {modErrorChannel: newModErrorChannel}));
    }

    private async getGuildConfigObject(guildId: string): Promise<GuildConfigObject> {
        return(<GuildConfigObject> await this.getDocument(guildId));
    }
}


interface GuildConfigObject {
    id?: string,
    prefix?: string,
    eventlogChannel?: string,
    vipRole?: string,
    modRole?: string,
    adminRole?: string,
    modErrorChannel?: string
}