// import type { Bot } from 'Bot';
// import type { CommandGroup } from 'commands/CommandGroup';
import { Logger } from 'Logger';

// import type { Message, PermissionResolvable } from 'discord.js';
import type { CommandContext } from 'CommandContext';
import type { CommandGroup } from './CommandGroup';

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

  // public readonly aliases: string[];

  // private readonly _permLevel: PermissionLevel;

  // public get permLevel(): PermissionLevel {
  //   return this._permLevel;
  // }

  // private readonly _requiredPerm?: PermissionResolvable | undefined;

  // public get requiredPerm(): PermissionResolvable | undefined {
  //   return this._requiredPerm;
  // }

  // public readonly desc: string;

  // public readonly longDesc: string;

  // public readonly usage: string;

  // public readonly runsInDm: boolean;

  public readonly parent?: CommandGroup;

  protected logger: Logger;

  private func: (ctx: CommandContext, ...args: any[]) => Promise<void>;

  // constructor(name: string, permLevel: PermissionLevel, desc: string, bot: Bot, params: CommandParameters = {}) {
  constructor(name: string, func: (ctx: CommandContext, ...args: any[]) => Promise<void>, parent?: CommandGroup) {
    this.name = name;
    this.func = func;
    this.parent = parent;
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
  public async invoke(ctx: CommandContext, ...args: any[]): Promise<boolean> {
    await this.func(ctx, ...args);
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
