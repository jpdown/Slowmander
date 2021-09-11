import {
  Command, PermissionLevel,
} from 'commands/Command';
import type { Bot } from 'Bot';

import { Message, PermissionResolvable, Permissions } from 'discord.js';
import { CommandManager } from 'CommandManager';
import type { CommandContext } from 'CommandContext';

export class CommandGroup extends Command {
  public readonly subCommands: Map<string, Command>;

  constructor(name: string, func: (ctx: CommandContext, ...args: any[]) => Promise<void>, parent?: CommandGroup) {
    super(name, func, parent);
    this.subCommands = new Map<string, Command>();
  }

  public getSubCommand(arg: string): Command | undefined {
    return this.subCommands.get(arg);
  }

//   public get permLevel(): PermissionLevel {
//     let lowestPerm = PermissionLevel.Owner;

//     this.subCommands.forEach((subCommand) => {
//       if (subCommand.permLevel < lowestPerm) {
//         lowestPerm = subCommand.permLevel;
//       }
//     });

//     return lowestPerm;
//   }

//   public get requiredPerm(): PermissionResolvable | undefined {
//     const perms: Permissions = new Permissions();
//     let numWithPerms = 0;

//     this.subCommands.forEach((subCommand) => {
//       if (subCommand.requiredPerm && !perms.any(subCommand.requiredPerm)) {
//         perms.add(subCommand.requiredPerm);
//         numWithPerms += 1;
//       }
//     });

//     if (numWithPerms === 0) {
//       return undefined;
//     }

//     return perms;
//   }

  public registerSubCommand(command: Command): void {
    this.subCommands.set(command.name, command);
    // command.aliases.forEach((alias) => {
    //   this.subCommands.set(alias, command);
    // });
  }
}
