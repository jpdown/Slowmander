import {Client, Snowflake} from 'discord.js';
import {Credentials} from './config/Credentials';
import { CommandManager } from './CommandManager';
import { ReactionRoleManager } from './reactionroles/ReactionRoleManager';
import { HelpManager } from './HelpManager';
import { Logger, LogLevel } from './Logger';
import { EventLogger } from './eventlogs/EventLogger';
import { DatabaseManager } from './config/DatabaseManager';
import { ConfigManager } from './config/ConfigManager';
import { VerificationManager } from './verification/VerificationManager';

export class PantherBot {
    private _client: Client;
    private _credentials: Credentials;
    private _configManager: ConfigManager;
    private _databaseManager: DatabaseManager;
    private _commandManager: CommandManager;
    private _reactionRoleManager: ReactionRoleManager;
    private _helpManager: HelpManager;
    private _verificationManager: VerificationManager;
    private logger: Logger;
    private _eventLogger: EventLogger;

    constructor() {
        this._client = new Client({partials: ['MESSAGE', 'REACTION']});
        this.logger = Logger.getLogger(this,this);
        this._credentials = new Credentials(this);
        this._databaseManager = new DatabaseManager(this, this._credentials.rethinkCreds);
        this._commandManager = new CommandManager(this);
        this._helpManager = new HelpManager;
        this._eventLogger = new EventLogger(this);
        
        this._client.on('message', this._commandManager.parseCommand.bind(this._commandManager));
        this._client.on('ready', async () => {
            await this.logger.info(`Welcome to PantherBot-Discord-JS! Logged in as ${this._client.user.tag} in ${this._client.guilds.cache.size} guild(s).`);
        })
    }
    
    public run() {
        let token: string = this._credentials.token;
        if(token === "") {
            this.logger.logSync(LogLevel.ERROR, "No token provided, please put a valid token in the config file.");
            process.exit();
        }
        
        //Connect to db
        this._databaseManager.connect().then(() => {
            this._configManager = new ConfigManager(this);
            this._reactionRoleManager = new ReactionRoleManager(this);
            this._client.on('messageReactionAdd', this._reactionRoleManager.onMessageReactionAdd.bind(this._reactionRoleManager));
            this._client.on('messageReactionRemove', this._reactionRoleManager.onMessageReactionRemove.bind(this._reactionRoleManager));
            this._client.on("ready", this._reactionRoleManager.onReady.bind(this._reactionRoleManager))
        }).catch((err) => {
            this.logger.logSync(LogLevel.ERROR, "Error with db", err);
        })

        this._client.login(token);
    }

    public async addOwner(ownerId: Snowflake) {
        return(await this._credentials.addOwner(ownerId));
    }

    public async removeOwner(ownerId: Snowflake) {
        return(await this._credentials.removeOwner(ownerId));
    }

    public get owners(): Snowflake[] {
        return(this._credentials.owners);
    }

    public get catApiToken(): string {
        return(this._credentials.catApiToken)
    }

    public get configs(): ConfigManager {
        return(this._configManager);
    }

    public get databaseManager(): DatabaseManager {
        return(this._databaseManager);
    }

    public get commandManager(): CommandManager {
        return(this._commandManager);
    }

    public get reactionRoleManager(): ReactionRoleManager {
        return(this._reactionRoleManager);
    }

    public get helpManager(): HelpManager {
        return(this._helpManager);
    }

    public get client(): Client {
        return(this._client);
    }

    public get eventLogger(): EventLogger {
        return(this._eventLogger);
    }
}

let bot = new PantherBot;

bot.run();