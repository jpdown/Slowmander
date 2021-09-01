import { PantherBot } from 'Bot';
import { LogLevel, Logger } from 'Logger';

import * as fs from 'fs';

export class Credentials {
    readonly CREDENTIALS_PATH: string = "./data/credentials.json";

    private credentialsObject: CredentialsObject;
    private logger: Logger;

    constructor(bot: PantherBot) {
        this.credentialsObject = this.loadConfig();
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
                this.logger.logSync(LogLevel.ERROR, "Error loading main credentials file.", err);
                credsObject = undefined;
            }
        }

        if(credsObject === undefined) {
            credsObject = this.generateConfig();
            this.saveConfig();
            this.logger.logSync(LogLevel.INFO, "Default credentials generated.");
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
            this.logger.logSync(LogLevel.ERROR, "Error saving main credentials file.", err);
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
            owners: [],
            catApiToken: "",
            twitchId: "",
            twitchSecret: ""
        };
    }
}

type CredentialsObject = {
    token: string,
    owners: string[],
    catApiToken: "",
    twitchId: string,
    twitchSecret: string
}