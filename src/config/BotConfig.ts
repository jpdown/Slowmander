import r from "rethinkdb";
import { PantherBot } from "../Bot";
import { LogLevel } from "../Logger";
import { WebhookClient, NewsChannel } from "discord.js";

export class BotConfig {
    private static readonly TABLE: string = "BotConfig";

    private bot: PantherBot;
    private _defaultPrefix: string;
    private _defaultColor: string;
    private _errorWebhook: WebhookClient;

    constructor(bot: PantherBot) {
        this.bot = bot;

        //If we need to generate the table, do so
        r.db(this.bot.credentials.rethinkDb).tableList().run(this.bot.databaseManager.connection, (err, result) => {
            if(err) { 
                this.bot.logger.logSync(LogLevel.ERROR, "Error getting table list.", err);
                return;
            }

            if(!result.includes(BotConfig.TABLE)) {
                this.generateTable();
            }
        })
    }

    public async getDefaultPrefix(): Promise<string> {
        if(this._defaultPrefix) {
            return(this._defaultPrefix);
        }

        let bc: BotConfigObject = await this.getBotConfigObject();

        if(bc) {
            this._defaultPrefix = bc.defaultPrefix;
            return(bc.defaultPrefix);
        }

        return(undefined);
    }

    public async getDefaultColor(): Promise<string> {
        if(this._defaultColor) {
            return(this._defaultColor);
        }

        let bc: BotConfigObject = await this.getBotConfigObject();

        if(bc) {
            this._defaultColor = bc.defaultColor;
            return(bc.defaultColor);
        }

        return(undefined)
    }

    public async getErrorWebhook(): Promise<WebhookClient> {
        if(this._errorWebhook) {
            return(this._errorWebhook);
        }

        let bc: BotConfigObject = await this.getBotConfigObject();

        if(bc) {
            let client: WebhookClient = undefined;
            try {
                client = new WebhookClient(bc.errorWebhookId, bc.errorWebhookToken);
            }
            catch(err) {}
    
            this._errorWebhook = client;
            return(client);
        }

        return(undefined)
    }

    public async setDefaultPrefix(newPrefix: string) {
        await r.table(BotConfig.TABLE).update({defaultPrefix: newPrefix}).run(this.bot.databaseManager.connection);
        this._defaultPrefix = newPrefix;
    }

    public async setDefaultColor(newColor: string) {
        await r.table(BotConfig.TABLE).update({defaultColor: newColor}).run(this.bot.databaseManager.connection);
        this._defaultColor = newColor;
    }

    public async setErrorWebhook(newWebhook: WebhookClient) {
        await r.table(BotConfig.TABLE).update({errorWebhookId: newWebhook.id, errorWebhookToken: newWebhook.token}).run(this.bot.databaseManager.connection);
        this._errorWebhook = newWebhook;
    }

    private generateTable(): void {
        try {
            r.db(this.bot.credentials.rethinkDb).tableCreate(BotConfig.TABLE).run(this.bot.databaseManager.connection,
                (err, result) => {
                    if(err) throw err;
                    this.bot.logger.logSync(LogLevel.INFO, `Table ${BotConfig.TABLE} created successfully.`);
                });

            r.table(BotConfig.TABLE).insert({
                    defaultPrefix: "!",
                    defaultColor: "#f78acf",
                    errorWebhookId: "",
                    errorWebhookToken: ""
                }).run(this.bot.databaseManager.connection, 
                    (err, result) => {
                        if(err) throw err;
                        this.bot.logger.logSync(LogLevel.INFO, `Default data put in ${BotConfig.TABLE} successfully.`);
                    });
        }
        catch(err) {
            this.bot.logger.logSync(LogLevel.ERROR, "BotConfig:generateTable Error creating table.", err);
        }
    }

    private async getBotConfigObject(): Promise<BotConfigObject> {
        let bc: BotConfigObject = undefined;

        try {
            let result = await r.table(BotConfig.TABLE).limit(1).run(this.bot.databaseManager.connection)
            let resultArray = await result.toArray()
            bc = resultArray[0];
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, "BotConfig:getBotConfigObject Error getting from database.", err);
        }

        return(bc);
    }
}

interface BotConfigObject {
    defaultPrefix: string,
    defaultColor: string,
    errorWebhookId: string,
    errorWebhookToken: string
}