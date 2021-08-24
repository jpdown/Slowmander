import { PantherBot } from 'Bot';
import { LogLevel, Logger } from 'Logger';
import { RethinkCredentials } from 'config/DatabaseManager';

import * as fs from 'fs';

export class Credentials {
    readonly CREDENTIALS_PATH: string = "./data/credentials.json";

    private credentialsObject: CredentialsObject;
    private bot: PantherBot;
    private logger: Logger;

    constructor(bot: PantherBot) {
        this.credentialsObject = this.loadConfig();
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
    }

    public loadConfig(): CredentialsObject {
        let jsonData: string;
        let credsObject: CredentialsObject | undefined;

        if(fs.existsSync(this.CREDENTIALS_PATH)) {
            try {
                jsonData = fs.readFileSync(this.CREDENTIALS_PATH).toString();
                credsObject = <CredentialsObject>JSON.parse(jsonData);
            }
            catch(err) {
                this.logger.logSync(LogLevel.ERROR, "Error loading main config file.", err);
                credsObject = undefined;
            }
        }

        if(credsObject === undefined) {
            credsObject = this.generateConfig();
            this.saveConfig();
            this.logger.logSync(LogLevel.INFO, "Default config generated.");
        }

        return credsObject;
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
            rethinkDb: this.credentialsObject.rethinkDb,
            rethinkCert: this.credentialsObject.rethinkCert
        })
    }

    public get catApiToken(): string {
        return(this.credentialsObject.catApiToken);
    }

    public get twitchId(): string {
        return this.credentialsObject.twitchId;
    }

    public get twitchSecret(): string {
        return this.credentialsObject.twitchSecret;
    }

    private generateConfig(): CredentialsObject {
        return {
            token: "",
            catApiToken: "",
            owners: [],
            rethinkHost: "localhost",
            rethinkPort: 28015,
            rethinkUser: "admin",
            rethinkPass: "",
            rethinkDb: "pantherbot",
            rethinkCert: "",
            twitchId: "",
            twitchSecret: ""
        };
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
    rethinkDb: string,
    rethinkCert: string,
    twitchId: string,
    twitchSecret: string
}