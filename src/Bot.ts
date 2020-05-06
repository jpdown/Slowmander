import {Client, Message} from 'discord.js';
import {Config} from './Config';
import { CommandManager } from './CommandManager';

export class PantherBot {
    client: Client;
    config: Config;
    commandManager: CommandManager

    constructor() {
        this.client = new Client;
        this.config = new Config;
        this.commandManager = new CommandManager(this);

        this.client.on('message', this.commandManager.parseCommand.bind(this.commandManager));
        this.client.once('ready', () => {
            console.log(`${this.client.readyAt.toISOString()} - Welcome to PantherBot-Discord-JS! Logged in as ${this.client.user.tag} in ${this.client.guilds.cache.size} guild(s).`);
        })
    }

    run() {
        let token: string = this.config.getToken();
        if(token === "") {
            console.log("No token provided, please put a valid token in the config file.");
            process.exit();
        }

        this.client.login(token);
    }
}

let bot = new PantherBot;

bot.run();