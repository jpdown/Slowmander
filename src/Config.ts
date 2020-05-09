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
            jsonData = fs.readFileSync(this.CONFIG_PATH).toString();
            try {
                this.configObject = <ConfigObjectJSON>JSON.parse(jsonData);
            }
            catch(err) {
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
        let jsonData: string = JSON.stringify(this.configObject);
        fs.writeFileSync(this.CONFIG_PATH, jsonData);
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

    public get webhookId(): string {
        return(this.configObject.webhookId);
    }

    public set webhookId(newWebhookId: string) {
        this.configObject.webhookId = newWebhookId;

        this.saveConfig();
    }

    public get webhookToken(): string {
        return(this.configObject.webhookToken);
    }

    public set webhookToken(newWebhookToken: string) {
        this.configObject.webhookToken = newWebhookToken;

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
            webhookId: "",
            webhookToken: ""
        };

        this.saveConfig();

        this.bot.logger.logSync(LogLevel.INFO, "Default config generated.");
    }
}

interface ConfigObjectJSON {
    owner: string,
    token: string,
    prefix: string,
    adminRole: string,
    modRole: string,
    vipRole: string,
    webhookId: string,
    webhookToken: string
}
