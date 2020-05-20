import * as fs from 'fs';
import { PantherBot } from '../Bot';
import { LogLevel } from '../Logger';
import { RethinkCredentials } from './DatabaseManager';

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

    public async addOwner(ownerId: string): Promise<boolean> {
        if(!this.configObject.owners.includes(ownerId)) {
            this.configObject.owners.push(ownerId);
    
            this.saveConfig();
            return(true);
        }
        return(false);
    }

    public async removeOwner(ownerId: string): Promise<boolean> {
        if(this.configObject.owners.includes(ownerId)) {
            this.configObject.owners.splice(this.configObject.owners.indexOf(ownerId), 1);

            this.saveConfig();
            return(true);
        }
        return(false);
    }

    public get token(): string {
        return(this.configObject.token);
    }

    public get owners(): string[] {
        return(this.configObject.owners);
    }

    public get rethinkCreds(): RethinkCredentials {
        return({
            rethinkHost: this.configObject.rethinkHost,
            rethinkPort: this.configObject.rethinkPort,
            rethinkUser: this.configObject.rethinkUser,
            rethinkPass: this.configObject.rethinkPass,
            rethinkDb: this.configObject.rethinkDb
        })
    }

    private generateConfig() {
        this.configObject = {
            token: "",
            owners: [],
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
    owners: string[],
    rethinkHost: string,
    rethinkPort: number,
    rethinkUser: string,
    rethinkPass: string,
    rethinkDb: string
}