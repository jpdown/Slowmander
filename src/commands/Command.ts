// import type { Bot } from 'Bot';
// import type { CommandGroup } from 'commands/CommandGroup';
import { Logger } from "Logger";

// import type { Message, PermissionResolvable } from 'discord.js';
import type {
    ApplicationCommandOptionChoice,
    Channel,
    EmojiResolvable,
    ExcludeEnum,
    GuildChannel,
    GuildEmoji,
    GuildMember,
    Role,
    Snowflake,
    TextBasedChannel,
    User,
} from "discord.js";
import type { ChannelTypes } from "discord.js/typings/enums";

import type { CommandContext } from "CommandContext";
import type { CommandGroup } from "commands/CommandGroup";
import type { Bot } from "Bot";

export enum PermissionLevel {
    Disabled = -1,
    Everyone = 0,
    VIP = 1,
    Mod = 2,
    Admin = 3,
    Owner = 4,
}

export class Command {
    public readonly name: string;

    public readonly args?: CommandArgument[];

    // public readonly aliases: string[];

    private readonly _permLevel: PermissionLevel;

    public get permLevel(): PermissionLevel {
        return this._permLevel;
    }

    // private readonly _requiredPerm?: PermissionResolvable | undefined;

    // public get requiredPerm(): PermissionResolvable | undefined {
    //   return this._requiredPerm;
    // }

    public readonly desc: string;

    // public readonly longDesc: string;

    // public readonly usage: string;

    // The guild this command is registered for
    public readonly guild?: Snowflake;

    // If global command that can only be run in guilds
    public readonly guildOnly?: boolean;

    // If a slash command
    public readonly slash?: boolean;

    public readonly parent?: CommandGroup;

    protected readonly logger: Logger;

    protected readonly func: (
        ctx: CommandContext,
        ...args: any[]
    ) => Promise<void>;

    // constructor(name: string, permLevel: PermissionLevel, desc: string, bot: Bot, params: CommandParameters = {}) {
    constructor(
        name: string,
        desc: string,
        func: (ctx: CommandContext, ...args: any[]) => Promise<void>,
        permLevel: PermissionLevel,
        options: CommandOptions
    ) {
        this.name = name;
        this.desc = desc;
        this.func = func;
        this._permLevel = permLevel;
        this.parent = options.parent;

        this.args = options.args;
        this.guild = options.guild;
        this.guildOnly = options.guildOnly;
        this.slash = options.slash;

        // this._permLevel = permLevel;

        // this.aliases = params.aliases ? params.aliases : [];
        // this._requiredPerm = params.requiredPerm;
        // this.longDesc = params.longDesc ? params.longDesc : '';
        // this.usage = params.usage ? params.usage : '';
        // this.runsInDm = params.runsInDm !== undefined ? params.runsInDm : true;
        // this.group = params.group;

        this.logger = Logger.getLogger(this);
    }

    // abstract run(bot: Bot, message: Message, args: string[]): Promise<CommandResult>;
    public async invoke(
        ctx: CommandContext,
        args: CommandParsedType[] | undefined
    ): Promise<boolean> {
        if (this.parent) {
            await this.parent.invoke(ctx, args);
        }
        if (args) {
            await this.func(ctx, ...args);
        } else {
            await this.func(ctx);
        }
        return false;
    }

    // public get fullName(): string {
    //   let name = '';
    //   if (this.group) {
    //     name = `${this.group.fullName} `;
    //   }
    //   name += this.name;
    //   return name;
    // }
}

// export interface CommandResult {
//   sendHelp: boolean;
//   command: Command | null;
//   message: Message;
// }

// export interface CommandParameters {
//   aliases?: string[];
//   requiredPerm?: PermissionResolvable;
//   longDesc?: string;
//   usage?: string;
//   runsInDm?: boolean;
//   group?: CommandGroup;
// }

export type CommandOptions = {
    parent?: CommandGroup;
    args?: CommandArgument[];
    guild?: Snowflake;
    guildOnly?: boolean;
    slash?: boolean;
};

interface BaseCommandArgument {
    name: string;
    type: CommandArgumentType;
    description: string;
    optional?: boolean;
};

interface ChoicesCommandArgument extends BaseCommandArgument {
    type: "string" | "int" | "number";
    choices?: ApplicationCommandOptionChoice[];
}

interface ChannelCommandArgument extends BaseCommandArgument {
    type: "channel";
    channelTypes?: ExcludeEnum<typeof ChannelTypes, "UNKNOWN">[];
}

interface NumericCommandArgument extends BaseCommandArgument {
    type: "int" | "number";
    minValue?: number;
    maxValue?: number;
}

interface AutocompleteCommandArgument extends BaseCommandArgument {
    type: "string" | "int" | "number";
    autocomplete: true;
    choices: undefined;
    autocompleteFunc: (channel: TextBasedChannel, user: User, guildId: string | null, bot: Bot) => Promise<string[] | number[]>;
}

export type CommandArgument = BaseCommandArgument | ChoicesCommandArgument | ChannelCommandArgument | NumericCommandArgument | AutocompleteCommandArgument;

// TODO: Add mentionable, message
export type CommandArgs = {
    string: string,
    int: number,
    number: number,
    bool: boolean,
    user: User,
    member: GuildMember,
    channel: Channel,
    role: Role,
    emoji: EmojiResolvable
}
export type CommandArgumentType = keyof CommandArgs;
export type CommandParsedType = CommandArgs[keyof CommandArgs] | undefined;
