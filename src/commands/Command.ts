import { Logger } from "Logger";

import type {
    ApplicationCommandOptionChoice,
    Channel,
    EmojiResolvable,
    ExcludeEnum,
    GuildMember,
    Permissions,
    Role,
    Snowflake,
    TextBasedChannel,
    User,
} from "discord.js";
import type { ChannelTypes } from "discord.js/typings/enums";

import type { CommandContext } from "CommandContext";
import type { CommandGroup } from "commands/CommandGroup";
import type { Bot } from "Bot";
import { APIApplicationCommandOptionChoice, ChannelType } from "discord-api-types/v10";

export class Command {
    public readonly name: string;

    public readonly args?: CommandArgument[];

    public readonly permissions?: Permissions;

    public readonly ownerOnly?: boolean;

    public readonly desc: string;

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

    constructor(
        name: string,
        desc: string,
        func: (ctx: CommandContext, ...args: any[]) => Promise<void>,
        perms: Permissions | undefined,
        options: CommandOptions
    ) {
        this.name = name;
        this.desc = desc;
        this.func = func;
        this.permissions = perms;
        this.parent = options.parent;

        this.args = options.args;
        this.guild = options.guild;
        this.guildOnly = options.guildOnly;
        this.slash = options.slash;
        this.ownerOnly = options.ownerOnly;

        this.logger = Logger.getLogger(this);
    }

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

    public get fullName(): string {
        return this.parent ? `${this.parent.name} ${this.name}` : this.name;
    }
}

export type CommandOptions = {
    parent?: CommandGroup;
    args?: CommandArgument[];
    guild?: Snowflake;
    guildOnly?: boolean;
    slash?: boolean;
    ownerOnly?: boolean;
};

interface BaseCommandArgument {
    name: string;
    type: CommandArgumentType;
    description: string;
    optional?: boolean;
};

interface ChoicesCommandArgument extends BaseCommandArgument {
    type: "string" | "int" | "number";
    choices?: APIApplicationCommandOptionChoice[];
}

interface ChannelCommandArgument extends BaseCommandArgument {
    type: "channel";
    channelTypes?: Exclude<ChannelType,
        ChannelType.DM | ChannelType.GroupDM | ChannelType.GuildForum | ChannelType.GuildDirectory
    >;
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
