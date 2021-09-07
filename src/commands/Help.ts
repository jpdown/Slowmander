import { Command, PermissionLevel, CommandResult } from 'commands/Command';
import type Bot from 'Bot';
import HelpManager from 'HelpManager';

import type { Message } from 'discord.js';

// eslint-disable-next-line import/prefer-default-export
export class Help extends Command {
  constructor(bot: Bot) {
    super('help', PermissionLevel.Everyone, "You're using it!", bot, { usage: '[command]', aliases: ['h'] });
  }

  async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      await HelpManager.sendFullHelp(message, bot);
      return { sendHelp: false, command: this, message };
    }

    const command: Command | undefined = bot.commandManager.getCommand(<string>args.shift());

    if (!command) {
      await HelpManager.sendFullHelp(message, bot);
      return { sendHelp: false, command: this, message };
    }

    if (args.length > 0) {
      await HelpManager.sendCommandHelp(command, message, bot, args);
    } else {
      await HelpManager.sendCommandHelp(command, message, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}
