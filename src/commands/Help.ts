import {Command, PermissionLevel, CommandResult} from 'commands/Command';
import { PantherBot } from 'Bot';

import {Message} from 'discord.js';

export class Help extends Command {    
    constructor(bot: PantherBot) {
        super("help", PermissionLevel.Everyone, "You're using it!", bot, {usage: "[command]", aliases: ["h"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length === 0) {
            await bot.helpManager.sendFullHelp(message, bot);
            return {sendHelp: false, command: this, message: message};;
        }

        let command: Command = await bot.commandManager.getCommand(<string>args.shift());

        if(!command) {
            await bot.helpManager.sendFullHelp(message, bot);
            return {sendHelp: false, command: this, message: message};
        }

        if(args.length > 0) {
            await bot.helpManager.sendCommandHelp(command, message, bot, args);
        }
        else {
            await bot.helpManager.sendCommandHelp(command, message, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}