// import type { Bot } from 'Bot';
// import type { CommandGroup } from 'commands/CommandGroup';
import { Logger } from 'Logger';

// import type { Message, PermissionResolvable } from 'discord.js';
import type {
  ApplicationCommandOptionChoice, Channel, Role, User,
} from 'discord.js';
import type { ChannelTypes } from 'discord.js/typings/enums';

import type { CommandContext } from 'CommandContext';
import type { CommandGroup } from 'commands/CommandGroup';

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

  // public readonly desc: string;

  // public readonly longDesc: string;

  // public readonly usage: string;

  public readonly guildOnly?: boolean;

  public readonly parent?: CommandGroup;

  protected readonly logger: Logger;

  protected readonly func: (ctx: CommandContext, ...args: any[]) => Promise<void>;

  // constructor(name: string, permLevel: PermissionLevel, desc: string, bot: Bot, params: CommandParameters = {}) {
  constructor(name: string, func: (ctx: CommandContext, ...args: any[]) => Promise<void>, permLevel: PermissionLevel, options: CommandOptions) {
    this.name = name;
    this.func = func;
    this._permLevel = permLevel;
    this.parent = options.parent;

    this.args = options.args;
    this.guildOnly = options.guildOnly;

    // this._permLevel = permLevel;
    // this.desc = desc;

    // this.aliases = params.aliases ? params.aliases : [];
    // this._requiredPerm = params.requiredPerm;
    // this.longDesc = params.longDesc ? params.longDesc : '';
    // this.usage = params.usage ? params.usage : '';
    // this.runsInDm = params.runsInDm !== undefined ? params.runsInDm : true;
    // this.group = params.group;

    this.logger = Logger.getLogger(this);
  }

  // abstract run(bot: Bot, message: Message, args: string[]): Promise<CommandResult>;
  public async invoke(ctx: CommandContext, args: CommandParsedType[] | undefined): Promise<boolean> {
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
  guildOnly?: boolean;
};

export type CommandArgument = {
  name: string;
  type: CommandArgumentType;
  optional?: boolean;
  description?: string;
  autocomplete?: boolean;
  choices?: ApplicationCommandOptionChoice[];
  channelTypes?: ChannelTypes[];
};

export type CommandArgumentType = 'string' | 'int' | 'number' | 'bool' | 'user' | 'channel' | 'role';
export type CommandParsedType = string | number | boolean | User | Channel | Role | undefined;
