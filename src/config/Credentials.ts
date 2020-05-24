import * as fs from 'fs';
import { PantherBot } from '../Bot';
import { LogLevel, Logger } from '../Logger';
import { RethinkCredentials } from './DatabaseManager';

export class Credentials {
    readonly CREDENTIALS_PATH: string = "./data/config.json";

    private credentialsObject: CredentialsObject;
    private bot: PantherBot;
    private logger: Logger;

    constructor(bot: PantherBot) {
        this.credentialsObject = undefined;
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
        this.loadConfig();
    }

    public loadConfig() {
        let jsonData: string;

        if(fs.existsSync(this.CREDENTIALS_PATH)) {
            try {
                jsonData = fs.readFileSync(this.CREDENTIALS_PATH).toString();
                this.credentialsObject = <CredentialsObject>JSON.parse(jsonData);
            }
            catch(err) {
                this.logger.logSync(LogLevel.ERROR, "Error loading main config file.", err);
                this.credentialsObject = undefined;
            }
        }

        if(this.credentialsObject === undefined) {
            this.generateConfig();
        }
    }
    
    public saveConfig() {
        if(!fs.existsSync("data"))
            fs.mkdirSync("data");
        try {
            let jsonData: string = JSON.stringify(this.credentialsObject);
            fs.writeFileSync(this.CREDENTIALS_PATH, jsonData);
        }
        catch(err) {
            this.logger.logSync(LogLevel.ERROR, "Error saving main config file.", err);
        }
    }

    public async addOwner(ownerId: string): Promise<boolean> {
        if(!this.credentialsObject.owners.includes(ownerId)) {
            this.credentialsObject.owners.push(ownerId);
    
            this.saveConfig();
            return(true);
        }
        return(false);
    }

    public async removeOwner(ownerId: string): Promise<boolean> {
        if(this.credentialsObject.owners.includes(ownerId)) {
            this.credentialsObject.owners.splice(this.credentialsObject.owners.indexOf(ownerId), 1);

            this.saveConfig();
            return(true);
        }
        return(false);
    }

    public get token(): string {
        return(this.credentialsObject.token);
    }

    public get owners(): string[] {
        return(this.credentialsObject.owners);
    }

    public get rethinkCreds(): RethinkCredentials {
        return({
            rethinkHost: this.credentialsObject.rethinkHost,
            rethinkPort: this.credentialsObject.rethinkPort,
            rethinkUser: this.credentialsObject.rethinkUser,
            rethinkPass: this.credentialsObject.rethinkPass,
            rethinkDb: this.credentialsObject.rethinkDb
        })
    }

    public get catApiToken(): string {
        return(this.credentialsObject.catApiToken);
    }

    private generateConfig() {
        this.credentialsObject = {
            token: "",
            catApiToken: "",
            owners: [],
            rethinkHost: "localhost",
            rethinkPort: 28015,
            rethinkUser: "admin",
            rethinkPass: "",
            rethinkDb: "pantherbot"
        };

        this.saveConfig();

        this.logger.logSync(LogLevel.INFO, "Default config generated.");
    }
}

interface CredentialsObject {
    token: string,
    catApiToken: "",
    owners: string[],
    rethinkHost: string,
    rethinkPort: number,
    rethinkUser: string,
    rethinkPass: string,
    rethinkDb: string
}