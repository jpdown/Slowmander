import {Client, Message} from 'discord.js';
import {Config} from './Config';
import { CommandManager } from './CommandManager';
import { ReactionRoleManager } from './reactionroles/ReactionRoleManager';
import { HelpManager } from './HelpManager';
import { Logger, LogLevel } from './Logger';

export class PantherBot {
    private _client: Client;
    private _config: Config;
    private _commandManager: CommandManager;
    private _reactionRoleManager: ReactionRoleManager;
    private _helpManager: HelpManager;
    private _logger: Logger;

    constructor() {
        this._client = new Client({partials: ['MESSAGE', 'REACTION']});
        this._logger = new Logger(this);
        this._config = new Config(this);
        this._commandManager = new CommandManager(this);
        this._reactionRoleManager = new ReactionRoleManager(this);
        this._helpManager = new HelpManager;

        this._client.on('message', this._commandManager.parseCommand.bind(this._commandManager));
        this._client.on('messageReactionAdd', this._reactionRoleManager.onMessageReactionAdd.bind(this._reactionRoleManager));
        this._client.on('messageReactionRemove', this._reactionRoleManager.onMessageReactionRemove.bind(this._reactionRoleManager));
        this._client.on("ready", this._reactionRoleManager.onReady.bind(this._reactionRoleManager))
        this._client.on('ready', async () => {
            await this._logger.log(LogLevel.INFO, `Welcome to PantherBot-Discord-JS! Logged in as ${this._client.user.tag} in ${this._client.guilds.cache.size} guild(s).`);
        })
    }

    public run() {
        let token: string = this._config.token;
        if(token === "") {
            this._logger.logSync(LogLevel.ERROR, "No token provided, please put a valid token in the config file.");
            process.exit();
        }

        this._client.login(token);
    }

    public get config(): Config {
        return(this._config);
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

    public get logger(): Logger {
        return(this._logger);
    }
}

let bot = new PantherBot;

bot.run();