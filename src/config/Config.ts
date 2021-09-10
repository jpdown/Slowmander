import type { Bot } from 'Bot';
import { LogLevel, Logger } from 'Logger';

import {
  existsSync, readFileSync, mkdirSync, writeFileSync,
} from 'fs';
import { WebhookClient } from 'discord.js';

export class Config {
  private readonly CONFIG_PATH: string = './data/config.json';

  private configObject: ConfigObject;

  private logger: Logger;

  constructor(bot: Bot) {
    this.logger = Logger.getLogger(this);
    this.configObject = this.loadConfig();
  }

  public loadConfig(): ConfigObject {
    let jsonData: string;
    let tempConfig: ConfigObject | undefined;

    if (existsSync(this.CONFIG_PATH)) {
      try {
        jsonData = readFileSync(this.CONFIG_PATH).toString();
        tempConfig = <ConfigObject>JSON.parse(jsonData);
      } catch (err) {
        this.logger.logSync(LogLevel.ERROR, 'Error loading main config file.', err);
        tempConfig = undefined;
      }
    }

    if (tempConfig === undefined) {
      tempConfig = Config.generateConfig();
      this.saveConfig(tempConfig);
      this.logger.logSync(LogLevel.INFO, 'Default config generated.');
    }

    return tempConfig;
  }

  public saveConfig(config?: ConfigObject): boolean {
    if (!existsSync('data')) mkdirSync('data');
    try {
      let jsonData: string;
      if (config) {
        jsonData = JSON.stringify(config);
      } else {
        jsonData = JSON.stringify(this.configObject);
      }
      writeFileSync(this.CONFIG_PATH, jsonData);
      return true;
    } catch (err) {
      this.logger.logSync(LogLevel.ERROR, 'Error saving main config file.', err);
      return false;
    }
  }

  public async setErrorWebhook(newWebhook: WebhookClient): Promise<boolean> {
    const oldWebhookId = this.configObject.errorWebhookId;
    const oldWebhookToken = this.configObject.errorWebhookToken;

    this.configObject.errorWebhookId = newWebhook.id;
    this.configObject.errorWebhookToken = newWebhook.token;

    if (!this.saveConfig()) {
      this.configObject.errorWebhookId = oldWebhookId;
      this.configObject.errorWebhookToken = oldWebhookToken;
      return false;
    }

    return true;
  }

  public async setPrefix(newPrefix: string): Promise<boolean> {
    const oldPrefix = this.configObject.prefix;

    this.configObject.prefix = newPrefix;

    if (!this.saveConfig()) {
      this.configObject.prefix = oldPrefix;
      return false;
    }

    return true;
  }

  public get prefix(): string {
    return this.configObject.prefix;
  }

  public get color(): number {
    return this.configObject.color;
  }

  public get errorWebhook(): WebhookClient | null {
    if (!this.configObject.errorWebhookId || !this.configObject.errorWebhookToken) {
      return null;
    }

    return new WebhookClient({ id: this.configObject.errorWebhookId, token: this.configObject.errorWebhookToken });
  }

  private static generateConfig(): ConfigObject {
    return {
      prefix: '!',
      color: 42239,
      errorWebhookId: null,
      errorWebhookToken: null,
    };
  }
}

type ConfigObject = {
  prefix: string;
  color: number;
  errorWebhookId: string | null;
  errorWebhookToken: string | null;
};
