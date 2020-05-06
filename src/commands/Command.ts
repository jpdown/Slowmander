import {PantherBot} from '../Bot';
import {Message, TextChannel, DMChannel, NewsChannel, MessageEmbed, Guild} from 'discord.js';
import {CommandUtils} from '../utils/CommandUtils';

export enum PermissionLevel {
    Everyone = 0,
    VIP = 1,
    Mod = 2,
    Admin = 3,
    Owner = 4
}

export abstract class Command {
    name: string;
    permLevel: PermissionLevel;
    desc: string;
    usage: string;
    runsInDm: boolean;
    group: Command;

    constructor(name: string, permLevel: PermissionLevel, desc: string, usage: string, runsInDm: boolean, group?: Command) {
        this.name = name;
        this.permLevel = permLevel;
        this.desc = desc;
        this.usage = usage;
        this.runsInDm = runsInDm;
        this.group = group;
    }

    async abstract run(bot: PantherBot, message: Message, args: string): Promise<void>;

    async sendMessage(message: string, channel: TextChannel | DMChannel | NewsChannel) {
        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(channel))
            .setDescription(message);

        await channel.send(embed);
    }
}