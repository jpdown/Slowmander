import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';

import {Message, TextChannel, NewsChannel, DMChannel, Permissions} from 'discord.js';
import { CommandUtils } from '../utils/CommandUtils';

export class Say extends Command {
    constructor(bot: PantherBot) {
        super("say", PermissionLevel.Admin, "Sends a message as the bot", bot, {usage: "[channel/user]... <message>", requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        //we stealthy
        try {
            if(!(message.channel.type === "dm")) {
                await message.delete();
            }
        }
        catch(err) {
            //We probably just don't have perms, but log
            await this.logger.warning("Error deleting message from say command, likely missing perms.", err);
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