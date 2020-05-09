import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';

import {Message, MessageEmbed} from 'discord.js';
import { CommandUtils } from '../utils/CommandUtils';

export class Ping extends Command {
    constructor() {
        super("ping", PermissionLevel.Everyone, "Gets current bot ping to API", "", true);
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let m: Message = await message.channel.send("Testing ping...");

        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(message.channel))
            .setDescription(`Last Heartbeat: ${message.client.ws.ping}ms\nAPI Latency: ${m.createdTimestamp - message.createdTimestamp}ms`)

        await m.edit("", embed);

        return {sendHelp: false, command: this, message: message};
    }
}