import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';

import {Message, Channel, TextChannel, NewsChannel, DMChannel} from 'discord.js';
import { CommandUtils } from '../utils/CommandUtils';
import { LogLevel } from '../Logger';

export class Say extends Command {
    constructor() {
        super("say", PermissionLevel.Owner, "Sends a message as the bot", "[channel/user]... <message>", true);
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        //we stealthy
        try {
            await message.delete();
        }
        catch(err) {
            //We probably just don't have perms, but log
            await bot.logger.log(LogLevel.WARNING, "Say:run Error deleting message from say command, likely missing perms.", err);
        }

        let lastChannel: number = 0;
        let channelList: (TextChannel | NewsChannel | DMChannel)[] = [];
        let currChannel: TextChannel | NewsChannel | DMChannel;
        for(lastChannel = 0; lastChannel < args.length; lastChannel++) {
            currChannel = await CommandUtils.parseTextChannel(args[lastChannel], message.client);
            if(currChannel === undefined) {
                break;
            }

            channelList.push(currChannel);
        }

        //If no channels found, send message here
        if(channelList.length < 1) {
            channelList.push(message.channel);
        }

        let messageToSend: string = args.slice(lastChannel, args.length).join(" ");

        //Send message(s)
        for(let channel of channelList) {
            await this.sendMessage(messageToSend, channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}