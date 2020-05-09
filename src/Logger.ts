import { PantherBot } from "./Bot";
import { WebhookClient } from "discord.js";

import * as fs from "fs";

export class Logger {
    private readonly CONSOLE_LOG_LEVEL = LogLevel.INFO;
    private readonly FILE_LOG_LEVEL = LogLevel.INFO;
    private readonly DISCORD_LOG_LEVEL = LogLevel.WARNING;

    private readonly LOG_PATH = "./logs/pantherbot.log"

    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.bot = bot;
    }

    public logSync(logLevel: LogLevel, message: string, err?: any): void {
        this.log(logLevel, message, err).then( () => {
            return;
        });
    }

    public async log(logLevel: LogLevel, message: string, err?: any) {
        //build log string
        let logString: string = `${(new Date()).toISOString()} - ${LogLevel[logLevel]} ${message}`;
        if(err) {
            logString += `\n${err}`;
        }

        //Log to console
        if(logLevel >= this.CONSOLE_LOG_LEVEL) {
            if(logLevel >= LogLevel.WARNING)
                console.error(logString);
            else
                console.log(logString);
        }

        //Log to file
        if(logLevel >= this.FILE_LOG_LEVEL)
            this.logToFile(logString);
        
        //Log to Discord
        if(logLevel >= this.DISCORD_LOG_LEVEL)
            await this.logToDiscord(logString);
    }

    private logToFile(message: string) {
        if(!fs.existsSync("logs"))
            fs.mkdirSync("logs")
        if(!fs.existsSync(this.LOG_PATH)) {
            fs.writeFileSync(this.LOG_PATH, message + "\n");
        }
        else {
            fs.appendFileSync(this.LOG_PATH, message + "\n");
        }

    }

    private async logToDiscord(message: string) {
        let webhookId: string = this.bot.config.webhookId;
        let webhookToken: string = this.bot.config.webhookToken;

        if(webhookId === "" || webhookToken === "") {
            return;
        }

        try {
            let webhook: WebhookClient = new WebhookClient(webhookId, webhookToken);
            //Split every 1994 chars (to allow for code block)
            let splitMessage: string[] = [];
            for(let i = 0; i < message.length; i += 1994) {
                splitMessage.push(message.substr(i, (i + 1994 < message.length) ? i + 1994 : message.length));
            }
    
            //Post
            for(let logMessage of splitMessage) {
                await webhook.send("```" + logMessage + "```");
            }
        }
        //Nothing we can do
        catch(err) {}
    }
}

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3
}