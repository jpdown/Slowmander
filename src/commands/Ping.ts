import {Command, PermissionLevel, CommandResult} from 'commands/Command';
import { PantherBot } from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';

import {Message, MessageEmbed} from 'discord.js';

export class Ping extends Command {
    constructor(bot: PantherBot) {
        super("ping", PermissionLevel.Everyone, "Gets current bot ping to API", bot);
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let m: Message = await message.channel.send("Testing ping...");

        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(message.channel, bot))
            .setDescription(`Last Heartbeat: ${message.client.ws.ping}ms\nAPI Latency: ${m.createdTimestamp - message.createdTimestamp}ms`)

        await m.edit({embeds: [embed]});

        return {sendHelp: false, command: this, message: message};
    }
}