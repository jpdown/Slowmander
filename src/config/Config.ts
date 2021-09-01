import { Bot } from 'Bot';
import { LogLevel, Logger } from 'Logger';

import * as fs from 'fs';
import { WebhookClient } from 'discord.js';

export class Config {
    readonly CONFIG_PATH: string = "./data/config.json";

    private configObject: ConfigObject;
    private logger: Logger;

    constructor(bot: Bot) {
        this.configObject = this.loadConfig();
        this.logger = Logger.getLogger(bot, this);
    }

    public loadConfig(): ConfigObject {
        let jsonData: string;
        let configObject: ConfigObject | undefined;

        if(fs.existsSync(this.CONFIG_PATH)) {
            try {
                jsonData = fs.readFileSync(this.CONFIG_PATH).toString();
                configObject = <ConfigObject>JSON.parse(jsonData);
            }
            catch(err) {
                this.logger.logSync(LogLevel.ERROR, "Error loading main config file.", err);
                configObject = undefined;
            }
        }

        if(configObject === undefined) {
            configObject = this.generateConfig();
            this.saveConfig();
            this.logger.logSync(LogLevel.INFO, "Default config generated.");
        }

        return configObject;
    }
    
    public saveConfig(): boolean {
        if(!fs.existsSync("data"))
            fs.mkdirSync("data");
        try {
            let jsonData: string = JSON.stringify(this.configObject);
            fs.writeFileSync(this.CONFIG_PATH, jsonData);
            return true;
        }
        catch(err) {
            this.logger.logSync(LogLevel.ERROR, "Error saving main config file.", err);
            return false;
        }
    }

    public async setErrorWebhook(newWebhook: WebhookClient): Promise<boolean> {
        let oldWebhookId = this.configObject.errorWebhookId;
        let oldWebhookToken = this.configObject.errorWebhookToken;

        this.configObject.errorWebhookId = newWebhook.id;
        this.configObject.errorWebhookToken = newWebhook.token;

        if (!this.saveConfig()) {
            this.configObject.errorWebhookId = oldWebhookId;
            this.configObject.errorWebhookToken = oldWebhookToken;
            return false;
        }

        return true;
    }

    public async setPrefix(newPrefix: string): Promise<boolean> {
        let oldPrefix = this.configObject.prefix;

        this.configObject.prefix = newPrefix;

        if (!this.saveConfig()) {
            this.configObject.prefix = oldPrefix;
            return false;
        }

        return true;
    }

    public get prefix(): string {
        return this.configObject.prefix;
    }

    public get color(): number {
        return this.configObject.color;
    }

    public get errorWebhook(): WebhookClient | null {
        if (!this.configObject.errorWebhookId || !this.configObject.errorWebhookToken) {
            return null;
        }

        return new WebhookClient({id: this.configObject.errorWebhookId, token: this.configObject.errorWebhookToken});
    }

    private generateConfig(): ConfigObject {
        return {
            prefix: "!",
            color: 42239,
            errorWebhookId: null,
            errorWebhookToken: null
        };
    }
}

type ConfigObject = {
    prefix: string,
    color: number,
    errorWebhookId: string | null,
    errorWebhookToken: string | null
}