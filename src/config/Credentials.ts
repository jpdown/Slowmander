import type { Bot } from "Bot";
import { LogLevel, Logger } from "Logger";

import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";

export class Credentials {
    private readonly bot: Bot;

    readonly CREDENTIALS_FILE: string = "credentials.json";

    private CREDENTIALS_PATH: string;

    private credentialsObject: CredentialsObject;

    private logger: Logger;

    constructor(bot: Bot) {
        this.bot = bot;
        this.logger = Logger.getLogger(this);
        this.CREDENTIALS_PATH = bot.dataPath + "/" + this.CREDENTIALS_FILE;
        this.credentialsObject = this.loadConfig();
    }

    public loadConfig(): CredentialsObject {
        let jsonData: string;
        let credsObject: CredentialsObject | undefined;

        if (existsSync(this.CREDENTIALS_PATH)) {
            try {
                jsonData = readFileSync(this.CREDENTIALS_PATH).toString();
                credsObject = <CredentialsObject>JSON.parse(jsonData);
            } catch (err) {
                this.logger.logSync(
                    LogLevel.ERROR,
                    "Error loading main credentials file.",
                    err
                );
                credsObject = undefined;
            }
        }

        if (credsObject === undefined) {
            credsObject = Credentials.generateConfig();
            this.saveConfig(credsObject);
            this.logger.logSync(
                LogLevel.INFO,
                "Default credentials generated."
            );
        }

        return credsObject;
    }

    public saveConfig(creds?: CredentialsObject) {
        if (!existsSync(this.bot.dataPath)) mkdirSync(this.bot.dataPath);
        try {
            let jsonData: string;
            if (creds) {
                jsonData = JSON.stringify(creds);
            } else {
                jsonData = JSON.stringify(this.credentialsObject);
            }
            writeFileSync(this.CREDENTIALS_PATH, jsonData);
        } catch (err) {
            this.logger.logSync(
                LogLevel.ERROR,
                "Error saving main credentials file.",
                err
            );
        }
    }

    public async addOwner(ownerId: string): Promise<boolean> {
        if (!this.credentialsObject.owners.includes(ownerId)) {
            this.credentialsObject.owners.push(ownerId);

            this.saveConfig();
            return true;
        }
        return false;
    }

    public async removeOwner(ownerId: string): Promise<boolean> {
        if (this.credentialsObject.owners.includes(ownerId)) {
            this.credentialsObject.owners.splice(
                this.credentialsObject.owners.indexOf(ownerId),
                1
            );

            this.saveConfig();
            return true;
        }
        return false;
    }

    public get token(): string {
        return this.credentialsObject.token;
    }

    public get owners(): string[] {
        return this.credentialsObject.owners;
    }

    public get catApiToken(): string {
        return this.credentialsObject.catApiToken;
    }

    public get twitchId(): string {
        return this.credentialsObject.twitchId;
    }

    public get twitchSecret(): string {
        return this.credentialsObject.twitchSecret;
    }

    public get devIds(): string[] {
        return this.credentialsObject.devIds;
    }

    private static generateConfig(): CredentialsObject {
        return {
            token: "",
            owners: [],
            catApiToken: "",
            twitchId: "",
            twitchSecret: "",
            devIds: []
        };
    }
}

type CredentialsObject = {
    token: string;
    owners: string[];
    catApiToken: "";
    twitchId: string;
    twitchSecret: string;
    devIds: string[];
};
