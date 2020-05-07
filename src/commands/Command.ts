import {PantherBot} from '../Bot';
import {Message, TextChannel, DMChannel, NewsChannel, MessageEmbed, Guild, MessageOptions} from 'discord.js';
import {CommandUtils} from '../utils/CommandUtils';
import { CommandGroup } from './CommandGroup';

export enum PermissionLevel {
    Everyone = 0,
    VIP = 1,
    Mod = 2,
    Admin = 3,
    Owner = 4
}

export abstract class Command {
    protected _name: string;
    protected _permLevel: PermissionLevel;
    protected _desc: string;
    protected _usage: string;
    protected _runsInDm: boolean;
    protected _group: CommandGroup;

    constructor(name: string, permLevel: PermissionLevel, desc: string, usage: string, runsInDm: boolean, group?: CommandGroup) {
        this._name = name;
        this._permLevel = permLevel;
        this._desc = desc;
        this._usage = usage;
        this._runsInDm = runsInDm;
        this._group = group;
    }

    async abstract run(bot: PantherBot, message: Message, args: string[]): Promise<void>;

    async sendMessage(message: string, channel: TextChannel | DMChannel | NewsChannel, messageOptions?: MessageOptions) {
        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(channel))
            .setDescription(message);

        if(messageOptions !== undefined) {
            await channel.send(embed, messageOptions);
        }
        else {
            await channel.send(embed);
        }
    }

    public get name(): string {
        return(this._name);
    }

    public get permLevel(): PermissionLevel {
        return(this._permLevel);
    }

    public get desc(): string {
        return(this._desc);
    }

    public get usage(): string {
        return(this._usage);
    }

    public get runsInDm(): boolean {
        return(this._runsInDm);
    }

    public get group(): CommandGroup {
        return(this.group);
    }
}