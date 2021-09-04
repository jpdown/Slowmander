import { Command, PermissionLevel, CommandResult } from 'commands/Command';
import Bot from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';

import { Message, TextBasedChannels } from 'discord.js';

export class Say extends Command {
  constructor(bot: Bot) {
    super('say', PermissionLevel.Owner, 'Sends a message as the bot', bot, { usage: '[channel/user]... <message>' });
  }

  async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    // we stealthy
    try {
      if (!(message.channel.type === 'DM')) {
        await message.delete();
      }
    } catch (err) {
      // We probably just don't have perms, but log
      await this.logger.warning('Error deleting message from say command, likely missing perms.', err);
    }

    let lastChannel = 0;
    const channelList: TextBasedChannels[] = [];
    let currChannel: TextBasedChannels | null;
    for (lastChannel = 0; lastChannel < args.length; lastChannel++) {
      currChannel = await CommandUtils.parseTextChannel(args[lastChannel], message.client);
      if (currChannel === null) {
        break;
      }

      channelList.push(currChannel);
    }

    // If no channels found, send message here
    if (channelList.length < 1) {
      channelList.push(message.channel);
    }

    const messageToSend: string = args.slice(lastChannel, args.length).join(' ');

    // Send message(s)
    for (const channel of channelList) {
      await CommandUtils.sendMessage(messageToSend, channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}
