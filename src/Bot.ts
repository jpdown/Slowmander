import {Client, Message} from 'discord.js';
import {Config} from './Config';
import { CommandManager } from './CommandManager';
import { ReactionRoleManager } from './reactionroles/ReactionRoleManager';
import { HelpManager } from './HelpManager';

export class PantherBot {
    private _client: Client;
    private _config: Config;
    private _commandManager: CommandManager;
    private _reactionRoleManager: ReactionRoleManager;
    private _helpManager: HelpManager;

    constructor() {
        this._client = new Client({partials: ['MESSAGE', 'REACTION']});
        this._config = new Config;
        this._commandManager = new CommandManager(this);
        this._reactionRoleManager = new ReactionRoleManager(this);
        this._helpManager = new HelpManager;

        this._client.on('message', this._commandManager.parseCommand.bind(this._commandManager));
        this._client.on('messageReactionAdd', this._reactionRoleManager.onMessageReactionAdd.bind(this._reactionRoleManager));
        this._client.on('messageReactionRemove', this._reactionRoleManager.onMessageReactionRemove.bind(this._reactionRoleManager));
        this._client.on("ready", this._reactionRoleManager.onReady.bind(this._reactionRoleManager))
        this._client.once('ready', () => {
            console.log(`${this._client.readyAt.toISOString()} - Welcome to PantherBot-Discord-JS! Logged in as ${this._client.user.tag} in ${this._client.guilds.cache.size} guild(s).`);
        })
    }

    public run() {
        let token: string = this._config.getToken();
        if(token === "") {
            console.log("No token provided, please put a valid token in the config file.");
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
}

let bot = new PantherBot;

bot.run();