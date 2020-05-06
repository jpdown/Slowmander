import {Client, Message} from 'discord.js';
import {Config} from './Config';

export class PantherBot {
    client: Client;
    config: Config;

    constructor() {
        this.client = new Client;
        this.config = new Config;

        this.client.on('message', this.messageListener);
        this.client.once('ready', () => {
            console.log("ready");
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

    async messageListener(messageEvent: Message) {
        if(messageEvent.content === 'ping') {
            await messageEvent.reply("pong");
        }
    }
}

let bot = new PantherBot;

bot.run();