import r from "rethinkdb";
import { PantherBot } from "../Bot";
import { LogLevel } from "../Logger";
import { Snowflake } from "discord.js";

export class GuildConfig {
    private static readonly TABLE: string = "GuildConfig";

    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.bot = bot;

        //If we need to generate the table, do so
        r.db(this.bot.credentials.rethinkDb).tableList().run(this.bot.databaseManager.connection, (err, result) => {
            if(err) { 
                this.bot.logger.logSync(LogLevel.ERROR, "Error getting table list.", err);
                return;
            }

            if(!result.includes(GuildConfig.TABLE)) {
                this.generateTable();
            }
        })
    }

    public async getPrefix(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.prefix);
        }

        return(undefined);
    }

    public async setPrefix(guildId: Snowflake, newPrefix: string) {
        await r.table(GuildConfig.TABLE).insert({
            id: guildId,
            prefix: newPrefix
        },
        //Options
        {
            conflict: "update"
        }).run(this.bot.databaseManager.connection);
    }

    public async getEventlogChannel(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.eventlogChannel);
        }

        return(undefined);
    }

    public async setEventlogChannel(guildId: Snowflake, newChannel: string) {
        await r.table(GuildConfig.TABLE).insert({
            id: guildId,
            eventlogChannel: newChannel
        },
        //Options
        {
            conflict: "update"
        }).run(this.bot.databaseManager.connection);
    }

    public async getVipRole(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.vipRole);
        }

        return(undefined);
    }

    public async setVipRole(guildId: Snowflake, newVipRole: string) {
        await r.table(GuildConfig.TABLE).insert({
            id: guildId,
            vipRole: newVipRole
        },
        //Options
        {
            conflict: "update"
        }).run(this.bot.databaseManager.connection);
    }

    public async getModRole(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.modRole);
        }

        return(undefined);
    }

    public async setModRole(guildId: Snowflake, newModRole: string) {
        await r.table(GuildConfig.TABLE).insert({
            id: guildId,
            modRole: newModRole
        },
        //Options
        {
            conflict: "update"
        }).run(this.bot.databaseManager.connection);
    }

    public async getAdminRole(guildId: Snowflake): Promise<string> {
        let gc: GuildConfigObject = await this.getGuildConfigObject(guildId);

        if(gc) {
            return(gc.adminRole);
        }

        return(undefined);
    }

    public async setAdminRole(guildId: Snowflake, newAdminRole: string) {
        await r.table(GuildConfig.TABLE).insert({
            id: guildId,
            adminRole: newAdminRole
        },
        //Options
        {
            conflict: "update"
        }).run(this.bot.databaseManager.connection);
    }

    private generateTable(): void {
        try {
            r.db(this.bot.credentials.rethinkDb).tableCreate(GuildConfig.TABLE).run(this.bot.databaseManager.connection,
                (err, result) => {
                    if(err) throw err;
                    this.bot.logger.logSync(LogLevel.INFO, `Table ${GuildConfig.TABLE} created successfully.`);
                });
        }
        catch(err) {
            this.bot.logger.logSync(LogLevel.ERROR, "GuildConfig:generateTable Error creating table.", err);
        }
    }

    private async getGuildConfigObject(guildId: string): Promise<GuildConfigObject> {
        let bc: GuildConfigObject = undefined;

        try {
            bc = <GuildConfigObject> await r.table(GuildConfig.TABLE).get(guildId).run(this.bot.databaseManager.connection);
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, "GuildConfig:getGuildConfigObject Error getting from database.", err);
        }

        return(bc);
    }
}


interface GuildConfigObject {
    id: string,
    prefix: string,
    eventlogChannel: string,
    vipRole: string,
    modRole: string,
    adminRole: string
}