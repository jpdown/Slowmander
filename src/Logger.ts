import type { Bot } from "Bot";

import type { WebhookClient } from "discord.js";
import { existsSync, mkdirSync, writeFileSync, appendFileSync } from "fs";

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
}

export class Logger {
    private static readonly CONSOLE_LOG_LEVEL = LogLevel.INFO;

    private static readonly FILE_LOG_LEVEL = LogLevel.INFO;

    private static readonly DISCORD_LOG_LEVEL = LogLevel.WARNING;

    private static readonly LOG_PATH = "./logs/slowmander.log";

    public static bot: Bot;

    private className: string;

    constructor(className: string) {
        this.className = className;
    }

    public static getLogger(object: any): Logger {
        return new Logger(object.constructor.name);
    }

    public logSync(logLevel: LogLevel, message: string, err?: any): void {
        this.log(logLevel, message, err).then(() => {});
    }

    public async log(logLevel: LogLevel, message: string, err?: any) {
        // build log string
        let logString = `${new Date().toISOString()} - ${
            LogLevel[logLevel]
        } - ${this.className} - ${message}`;
        if (err) {
            if (err.stack) {
                logString += `\n${err.stack}`;
            } else {
                logString += `\n${err}`;
            }
        }

        // Log to console
        if (logLevel >= Logger.CONSOLE_LOG_LEVEL) {
            if (logLevel >= LogLevel.WARNING) console.error(logString);
            else console.log(logString);
        }

        // Log to file
        if (logLevel >= Logger.FILE_LOG_LEVEL) Logger.logToFile(logString);

        // Log to Discord
        if (logLevel >= Logger.DISCORD_LOG_LEVEL)
            await Logger.logToDiscord(logString);
    }

    public async debug(message: string, err?: any) {
        await this.log(LogLevel.DEBUG, message, err);
    }

    public async info(message: string, err?: any) {
        await this.log(LogLevel.INFO, message, err);
    }

    public async warning(message: string, err?: any) {
        await this.log(LogLevel.WARNING, message, err);
    }

    public async error(message: string, err?: any) {
        await this.log(LogLevel.ERROR, message, err);
    }

    private static logToFile(message: string) {
        if (!existsSync("logs")) mkdirSync("logs");
        if (!existsSync(Logger.LOG_PATH)) {
            writeFileSync(Logger.LOG_PATH, `${message}\n`);
        } else {
            appendFileSync(Logger.LOG_PATH, `${message}\n`);
        }
    }

    private static async logToDiscord(message: string) {
        try {
            const webhook: WebhookClient | null =
                Logger.bot.config.errorWebhook;
            if (!webhook) {
                return;
            }
            // Split every 1990 chars (to allow for code block plus some)
            const splitMessage: string[] = [];
            let currEnd: number;
            for (let i = 0; i < message.length; i += 1990) {
                if (i + 1990 < message.length) currEnd = 1990;
                else currEnd = message.length - i;
                splitMessage.push(message.substr(i, currEnd));
            }
            // Post
            for (let i = 0; i < splitMessage.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await webhook.send(`\`\`\`${splitMessage[i]}\`\`\``);
            }
        } catch (err) {
            // Nothing we can do
        }
    }
}
