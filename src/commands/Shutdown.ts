import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';

import {Message} from 'discord.js';
import { CommandUtils } from '../utils/CommandUtils';


export class Shutdown extends Command {
    constructor(bot: PantherBot) {
        super("shutdown", PermissionLevel.Owner, "Shuts down the bot.", bot, {aliases: ["die", "kill"]});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        await CommandUtils.sendMessage("Shutting down... 👋", message.channel, bot);

        message.client.destroy();

        process.exit();
    }
}