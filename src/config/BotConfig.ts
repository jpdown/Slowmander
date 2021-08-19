import { PantherBot } from "Bot";
import { DatabaseEntry, DatabaseObject } from "config/DatabaseEntry";

import { WebhookClient } from "discord.js";

export class BotConfig extends DatabaseEntry<BotConfigObject> {
    private static readonly TABLE: string = "BotConfig";

    private static readonly DEFAULT_ENTRY: BotConfigObject = {
        defaultPrefix: "!",
        defaultColor: "#00a4ff",
        errorWebhookId: "",
        errorWebhookToken: ""
    }

    private _defaultPrefix: string;
    private _defaultColor: string;
    private _errorWebhook: WebhookClient;

    constructor(bot: PantherBot) {
        super(BotConfig.TABLE, BotConfig.DEFAULT_ENTRY, bot);
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

    public async setDefaultPrefix(newPrefix: string): Promise<boolean> {
        let result: boolean = await this.updateFirstDocument({defaultPrefix: newPrefix});
        if(result) this._defaultPrefix = newPrefix;

        return(result);
    }

    public async setDefaultColor(newColor: string): Promise<boolean> {
        let result: boolean = await this.updateFirstDocument({defaultColor: newColor});
        if(result) this._defaultColor = newColor;

        return(result);
    }

    public async setErrorWebhook(newWebhook: WebhookClient): Promise<boolean> {
        let result: boolean = await this.updateFirstDocument({errorWebhookId: newWebhook.id, errorWebhookToken: newWebhook.token});
        if(result) this._errorWebhook = newWebhook;

        return(result);
    }

    private async getBotConfigObject(): Promise<BotConfigObject> {
        return(<BotConfigObject> await this.getFirstDocument());
    }
}

interface BotConfigObject extends DatabaseObject {
    defaultPrefix?: string,
    defaultColor?: string,
    errorWebhookId?: string,
    errorWebhookToken?: string
}