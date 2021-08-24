import {PantherBot} from 'Bot';
import { CommandGroup } from 'commands/CommandGroup';
import { Logger } from 'Logger';

import {Message, PermissionResolvable} from 'discord.js';

export enum PermissionLevel {
    Disabled = -1,
    Everyone = 0,
    VIP = 1,
    Mod = 2,
    Admin = 3,
    Owner = 4
}

export abstract class Command {
    protected _name: string;
    protected _aliases: string[];
    protected _permLevel: PermissionLevel;
    protected _requiredPerm?: PermissionResolvable;
    protected _desc: string;
    protected _longDesc: string;
    protected _usage: string;
    protected _runsInDm: boolean;
    protected _group?: CommandGroup;
    protected logger: Logger;

    constructor(name: string, permLevel: PermissionLevel, desc: string, bot: PantherBot, params?: CommandParameters) {
        this._name = name;
        this._permLevel = permLevel;
        this._desc = desc;

        if(!params) params = <CommandParameters>{};

        this._aliases = params.aliases ? params.aliases : [];
        this._requiredPerm = params.requiredPerm;
        this._longDesc = params.longDesc ? params.longDesc : "";
        this._usage = params.usage ? params.usage : "";
        this._runsInDm = (params.runsInDm != undefined) ? params.runsInDm : true;
        this._group = params.group;

        this.logger = Logger.getLogger(bot, this);
    }

    abstract run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult>;

    public get name(): string {
        return(this._name);
    }

    public get aliases(): string[] {
        return(this._aliases);
    }

    public get fullName(): string {
        let name: string = "";
        if(this._group) {
            name = this._group.fullName + " ";
        }
        name += this._name;
        return(name);
    }

    public get permLevel(): PermissionLevel {
        return(this._permLevel);
    }

    public get requiredPerm(): PermissionResolvable | undefined {
        return(this._requiredPerm);
    }

    public get desc(): string {
        return(this._desc);
    }

    public get longDesc(): string {
        let desc: string = this._desc;
        if(this._longDesc !== "") {
            desc += "\n\n" + this._longDesc;
        }

        return(desc);
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

export interface CommandResult {
    sendHelp: boolean,
    command: Command | null,
    message: Message
}

export interface CommandParameters {
    aliases?: string[],
    requiredPerm?: PermissionResolvable,
    longDesc?: string,
    usage?: string,
    runsInDm?: boolean,
    group?: CommandGroup
}