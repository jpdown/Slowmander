import { Command, PermissionLevel, CommandResult } from 'commands/Command';
import Bot from 'Bot';
import CommandUtils from 'utils/CommandUtils';

import { Message } from 'discord.js';

// eslint-disable-next-line import/prefer-default-export
export class Shutdown extends Command {
  constructor(bot: Bot) {
    super('shutdown', PermissionLevel.Owner, 'Shuts down the bot.', bot, { aliases: ['die', 'kill'] });
  }

  // eslint-disable-next-line class-methods-use-this
  public async run(bot: Bot, message: Message): Promise<CommandResult> {
    await CommandUtils.sendMessage('Shutting down... 👋', message.channel, bot);

    message.client.destroy();

    process.exit();
  }
}
