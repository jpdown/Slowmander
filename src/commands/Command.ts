import { Bot } from 'Bot';
import CommandGroup from 'commands/CommandGroup';
import { Logger } from 'Logger';

import { Message, PermissionResolvable } from 'discord.js';

export enum PermissionLevel {
  Disabled = -1,
  Everyone = 0,
  VIP = 1,
  Mod = 2,
  Admin = 3,
  Owner = 4,
}

export abstract class Command {
  public readonly name: string;

  public readonly aliases: string[];

  private readonly _permLevel: PermissionLevel;

  public get permLevel(): PermissionLevel {
    // eslint-disable-next-line no-underscore-dangle
    return this._permLevel;
  }

  public readonly requiredPerm?: PermissionResolvable;

  public readonly desc: string;

  public readonly longDesc: string;

  public readonly usage: string;

  public readonly runsInDm: boolean;

  public readonly group?: CommandGroup;

  protected logger: Logger;

  constructor(name: string, permLevel: PermissionLevel, desc: string, bot: Bot, params: CommandParameters = {}) {
    this.name = name;
    // eslint-disable-next-line no-underscore-dangle
    this._permLevel = permLevel;
    this.desc = desc;

    this.aliases = params.aliases ? params.aliases : [];
    this.requiredPerm = params.requiredPerm;
    this.longDesc = params.longDesc ? params.longDesc : '';
    this.usage = params.usage ? params.usage : '';
    this.runsInDm = params.runsInDm !== undefined ? params.runsInDm : true;
    this.group = params.group;

    this.logger = Logger.getLogger(bot, this);
  }

  abstract run(bot: Bot, message: Message, args: string[]): Promise<CommandResult>;

  public get fullName(): string {
    let name = '';
    if (this.group) {
      name = `${this.group.fullName} `;
    }
    name += this.name;
    return name;
  }
}

export interface CommandResult {
  sendHelp: boolean;
  command: Command | null;
  message: Message;
}

export interface CommandParameters {
  aliases?: string[];
  requiredPerm?: PermissionResolvable;
  longDesc?: string;
  usage?: string;
  runsInDm?: boolean;
  group?: CommandGroup;
}
