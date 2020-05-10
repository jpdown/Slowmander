import * as fs from 'fs';
import { PantherBot } from './Bot';
import { LogLevel } from './Logger';

export class Config {
    readonly CONFIG_PATH: string = "./data/config.json";

    private configObject: ConfigObjectJSON;
    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.configObject = undefined;
        this.bot = bot;
        this.loadConfig();
    }

    public loadConfig() {
        let jsonData: string;

        if(fs.existsSync(this.CONFIG_PATH)) {
            try {
                jsonData = fs.readFileSync(this.CONFIG_PATH).toString();
                this.configObject = <ConfigObjectJSON>JSON.parse(jsonData);
            }
            catch(err) {
                this.bot.logger.logSync(LogLevel.ERROR, "Config:loadConfig Error loading main config file.", err);
                this.configObject = undefined;
            }
        }

        if(this.configObject === undefined) {
            this.generateConfig();
        }
    }
    
    public saveConfig() {
        if(!fs.existsSync("data"))
            fs.mkdirSync("data");
        try {
            let jsonData: string = JSON.stringify(this.configObject);
            fs.writeFileSync(this.CONFIG_PATH, jsonData);
        }
        catch(err) {
            this.bot.logger.logSync(LogLevel.ERROR, "Config:saveConfig Error saving main config file.", err);
        }
    }

    public get token(): string {
        return(this.configObject.token);
    }

    public get owner(): string {
        return(this.configObject.owner);
    }

    public set owner(newOwner: string) {
        this.configObject.owner = newOwner;

        this.saveConfig();
    }

    public get prefix(): string {
        return(this.configObject.prefix);
    }

    public set prefix(newPrefix: string) {
        this.configObject.prefix = newPrefix;

        this.saveConfig();
    }

    public get adminRole(): string {
        return(this.configObject.adminRole);
    }

    public set adminRole(newAdminRole: string) {
        this.configObject.adminRole = newAdminRole;

        this.saveConfig();
    }

    public get modRole(): string {
        return(this.configObject.modRole);
    }

    public set modRole(newModRole: string) {
        this.configObject.modRole = newModRole;

        this.saveConfig();
    }

    public get vipRole(): string {
        return(this.configObject.vipRole);
    }

    public set vipRole(newVipRole: string) {
        this.configObject.vipRole = newVipRole;

        this.saveConfig();
    }

    public get errorWebhookId(): string {
        return(this.configObject.errorWebhookId);
    }

    public set errorWebhookId(newWebhookId: string) {
        this.configObject.errorWebhookId = newWebhookId;

        this.saveConfig();
    }

    public get errorWebhookToken(): string {
        return(this.configObject.errorWebhookToken);
    }

    public set errorWebhookToken(newWebhookToken: string) {
        this.configObject.errorWebhookToken = newWebhookToken;

        this.saveConfig();
    }

    public get eventlogChannelId(): string {
        return(this.configObject.eventlogChannelId);
    }

    public set eventlogChannelId(newChannelId: string) {
        this.configObject.eventlogChannelId = newChannelId;

        this.saveConfig();
    }

    public get defaultColor(): string {
        return(this.configObject.defaultColor);
    }

    public set defaultColor(newDefaultColor: string) {
        this.configObject.defaultColor = newDefaultColor;

        this.saveConfig();
    }

    private generateConfig() {
        this.configObject = {
            owner: "",
            token: "",
            prefix: "!",
            adminRole: "",
            modRole: "",
            vipRole: "",
            errorWebhookId: "",
            errorWebhookToken: "",
            eventlogChannelId: "",
            defaultColor: "#f78acf"
        };

        this.saveConfig();

        this.bot.logger.logSync(LogLevel.INFO, "Config:generateConfig Default config generated.");
    }
}

interface ConfigObjectJSON {
    owner: string,
    token: string,
    prefix: string,
    adminRole: string,
    modRole: string,
    vipRole: string,
    errorWebhookId: string,
    errorWebhookToken: string,
    eventlogChannelId: string,
    defaultColor: string
}
