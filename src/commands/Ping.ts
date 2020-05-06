import {Command, PermissionLevel} from './Command';
import { PantherBot } from '../Bot';

import {Message} from 'discord.js';

export class Ping extends Command {
    constructor() {
        super("ping", PermissionLevel.Everyone, "Gets current bot ping to API", "", true);
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        let currPing: number = message.client.ws.ping;

        this.sendMessage(`Current heartbeat: ${currPing}ms`, message.channel);
    }
}