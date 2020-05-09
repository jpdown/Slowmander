import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';

import {Message} from 'discord.js';


export class Shutdown extends Command {
    constructor() {
        super("shutdown", PermissionLevel.Owner, "Shuts down the bot.", "", true);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        await this.sendMessage("Shutting down... 👋", message.channel);

        message.client.destroy();

        return {sendHelp: false, command: this, message: message};
    }
}