import * as fs from 'fs';
import { PantherBot } from '../Bot';
import { LogLevel } from '../Logger';
import { DatabaseManager } from './DatabaseManager';

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

    public get eventlogChannelId(): string {
        return(this.configObject.eventlogChannelId);
    }

    public set eventlogChannelId(newChannelId: string) {
        this.configObject.eventlogChannelId = newChannelId;

        this.saveConfig();
    }

    public get rethinkHost(): string {
        return(this.configObject.rethinkHost);
    }

    public get rethinkPort(): number {
        return(this.configObject.rethinkPort);
    }

    public get rethinkUser(): string {
        return(this.configObject.rethinkUser);
    }

    public get rethinkPass(): string {
        return(this.configObject.rethinkPass);
    }

    public get rethinkDb(): string {
        return(this.configObject.rethinkDb);
    }

    private generateConfig() {
        this.configObject = {
            token: "",
            owner: "",
            prefix: "!",
            adminRole: "",
            modRole: "",
            vipRole: "",
            eventlogChannelId: "",
            rethinkHost: "localhost",
            rethinkPort: 28015,
            rethinkUser: "admin",
            rethinkPass: "",
            rethinkDb: "pantherbot"
        };

        this.saveConfig();

        this.bot.logger.logSync(LogLevel.INFO, "Config:generateConfig Default config generated.");
    }
}

interface ConfigObjectJSON {
    token: string,
    owner: string,
    prefix: string,
    adminRole: string,
    modRole: string,
    vipRole: string,
    eventlogChannelId: string,
    rethinkHost: string,
    rethinkPort: number,
    rethinkUser: string,
    rethinkPass: string,
    rethinkDb: string
}
