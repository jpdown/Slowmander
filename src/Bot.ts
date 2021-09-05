import { Credentials } from 'config/Credentials';
import CommandManager from 'CommandManager';
import ReactionRoleManager from 'reactionroles/ReactionRoleManager';
import { HelpManager } from 'HelpManager';
import { Logger, LogLevel } from 'Logger';
import EventLogger from 'eventlogs/EventLogger';
import { DatabaseManager } from 'config/DatabaseManager';
import { ConfigManager } from 'config/ConfigManager';
import VerificationManager from 'verification/VerificationManager';
import TwitchAPIManager from 'twitch/TwitchAPIManager';
import TwitchClipModManager from 'twitch/TwitchClipModManager';

import { Client, Snowflake } from 'discord.js';
import { Config } from 'config/Config';

export default class Bot {
  private _client: Client;

  private _credentials: Credentials;

  private _config: Config;

  private _configManager: ConfigManager;

  // private _databaseManager: DatabaseManager;

  private _commandManager: CommandManager;

  private _reactionRoleManager: ReactionRoleManager;

  private _helpManager: HelpManager;

  private _verificationManager: VerificationManager;

  private _twitchApiManager: TwitchAPIManager;

  private _twitchClipModManager: TwitchClipModManager;

  private logger: Logger;

  private _eventLogger: EventLogger;

  constructor() {
    this._client = new Client({
      intents: [
        'GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_EMOJIS_AND_STICKERS',
        'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS',
        'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS',
      ],
      partials: ['MESSAGE', 'REACTION'],
    });
    this.logger = Logger.getLogger(this, this);
    this._credentials = new Credentials(this);
    this._config = new Config(this);
    // this._databaseManager = new DatabaseManager(this, this._credentials.rethinkCreds);
    this._commandManager = new CommandManager(this);
    this._helpManager = new HelpManager();
    this._eventLogger = new EventLogger(this);
    this._verificationManager = new VerificationManager(this);
    this._twitchApiManager = new TwitchAPIManager(this, this._credentials.twitchId, this._credentials.twitchSecret);
    this._twitchClipModManager = new TwitchClipModManager(this);
    this._configManager = new ConfigManager(this);
    this._reactionRoleManager = new ReactionRoleManager(this);

    this._client.on('ready', async () => {
      await this.logger.info(`Welcome to Slowmander! Logged in as ${this._client.user!.tag} in ${this._client.guilds.cache.size} guild(s).`);
    });
  }

  public run() {
    const { token } = this._credentials;
    if (token === '') {
      this.logger.logSync(LogLevel.ERROR, 'No token provided, please put a valid token in the config file.');
      process.exit();
    }

    // Connect to db
    // this._databaseManager.connect().then(() => {
    //   this._client.on('message', this._commandManager.parseCommand.bind(this._commandManager));
    //   this._client.on('messageReactionAdd', this._reactionRoleManager.onMessageReactionAdd.bind(this._reactionRoleManager));
    //   this._client.on('messageReactionRemove', this._reactionRoleManager.onMessageReactionRemove.bind(this._reactionRoleManager));
    //   this._client.on('ready', this._reactionRoleManager.onReady.bind(this._reactionRoleManager));
    //   this._client.on('guildMemberAdd', this._verificationManager.onGuildMemberAdd.bind(this._verificationManager));
    //   this._client.on('messageReactionAdd', this._verificationManager.onMessageReactionAdd.bind(this._verificationManager));
    //   this._client.on('message', this._twitchClipModManager.onMessage.bind(this._twitchClipModManager));
    //   this._client.on('messageUpdate', this._twitchClipModManager.onMessageUpdate.bind(this._twitchClipModManager));
    // }).catch((err) => {
    //   this.logger.logSync(LogLevel.ERROR, 'Error with db', err);
    // });

    this._client.login(token);
  }

  public async addOwner(ownerId: Snowflake) {
    return this._credentials.addOwner(ownerId);
  }

  public async removeOwner(ownerId: Snowflake) {
    return this._credentials.removeOwner(ownerId);
  }

  public get owners(): Snowflake[] {
    return this._credentials.owners;
  }

  public get catApiToken(): string {
    return this._credentials.catApiToken;
  }

  public get config(): Config {
    return this._config;
  }

  public get configs(): ConfigManager {
    return this._configManager;
  }

  // public get databaseManager(): DatabaseManager {
  //   return this._databaseManager;
  // }

  public get commandManager(): CommandManager {
    return this._commandManager;
  }

  public get reactionRoleManager(): ReactionRoleManager {
    return this._reactionRoleManager;
  }

  public get helpManager(): HelpManager {
    return this._helpManager;
  }

  public get twitchApiManager(): TwitchAPIManager {
    return this._twitchApiManager;
  }

  public get client(): Client {
    return this._client;
  }

  public get eventLogger(): EventLogger {
    return this._eventLogger;
  }
}

const bot = new Bot();

bot.run();
