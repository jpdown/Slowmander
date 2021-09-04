import Bot from 'Bot';

import { WebhookClient } from 'discord.js';
import {
  existsSync, mkdirSync, writeFileSync, appendFileSync,
} from 'fs';

export class Logger {
  private readonly CONSOLE_LOG_LEVEL = LogLevel.INFO;

  private readonly FILE_LOG_LEVEL = LogLevel.INFO;

  private readonly DISCORD_LOG_LEVEL = LogLevel.WARNING;

  private readonly LOG_PATH = './logs/slowmander.log';

  private bot: Bot;

  private className: string;

  constructor(bot: Bot, className: string) {
    this.bot = bot;
    this.className = className;
  }

  public static getLogger(bot: Bot, object: any): Logger {
    return new Logger(bot, object.constructor.name);
  }

  public logSync(logLevel: LogLevel, message: string, err?: any): void {
    this.log(logLevel, message, err).then(() => {

    });
  }

  public async log(logLevel: LogLevel, message: string, err?: any) {
    // build log string
    let logString = `${new Date().toISOString()} - ${LogLevel[logLevel]} - ${this.className} - ${message}`;
    if (err) {
      if (err.stack) {
        logString += `\n${err.stack}`;
      } else {
        logString += `\n${err}`;
      }
    }

    // Log to console
    if (logLevel >= this.CONSOLE_LOG_LEVEL) {
      if (logLevel >= LogLevel.WARNING) console.error(logString);
      else console.log(logString);
    }

    // Log to file
    if (logLevel >= this.FILE_LOG_LEVEL) this.logToFile(logString);

    // Log to Discord
    if (logLevel >= this.DISCORD_LOG_LEVEL) await this.logToDiscord(logString);
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

  private logToFile(message: string) {
    if (!existsSync('logs')) mkdirSync('logs');
    if (!existsSync(this.LOG_PATH)) {
      writeFileSync(this.LOG_PATH, `${message}\n`);
    } else {
      appendFileSync(this.LOG_PATH, `${message}\n`);
    }
  }

  private async logToDiscord(message: string) {
    try {
      const webhook: WebhookClient | null = this.bot.config.errorWebhook;
      if (!webhook) {
        return;
      }
      // Split every 1990 chars (to allow for code block plus some)
      const splitMessage: string[] = [];
      let currEnd: number;
      for (let i = 0; i < message.length; i += 1990) {
        if ((i + 1990) < message.length) currEnd = 1990;
        else currEnd = message.length - i;
        splitMessage.push(message.substr(i, currEnd));
      }
      // Post
      for (let i = 0; i < splitMessage.length; i++) {
        await webhook.send(`\`\`\`${splitMessage[i]}\`\`\``);
      }
    }
    // Nothing we can do
    catch (err) {}
  }
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}
