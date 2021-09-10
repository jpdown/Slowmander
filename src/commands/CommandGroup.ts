import {
  Command, PermissionLevel, CommandResult, CommandParameters,
} from 'commands/Command';
import type { Bot } from 'Bot';

import { Message, PermissionResolvable, Permissions } from 'discord.js';
import { CommandManager } from 'CommandManager';

export abstract class CommandGroup extends Command {
  public readonly subCommands: Map<string, Command>;

  constructor(name: string, desc: string, bot: Bot, params: CommandParameters = {}) {
    const newParams = params;
    newParams.usage = '<subcommand>';
    super(name, PermissionLevel.Owner, desc, bot, newParams);
    this.subCommands = new Map<string, Command>();
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    return CommandManager.parseSubCommand(this, args, message, bot);
  }

  public getSubCommand(arg: string): Command | undefined {
    return this.subCommands.get(arg);
  }

  public get permLevel(): PermissionLevel {
    let lowestPerm = PermissionLevel.Owner;

    this.subCommands.forEach((subCommand) => {
      if (subCommand.permLevel < lowestPerm) {
        lowestPerm = subCommand.permLevel;
      }
    });

    return lowestPerm;
  }

  public get requiredPerm(): PermissionResolvable | undefined {
    const perms: Permissions = new Permissions();
    let numWithPerms = 0;

    this.subCommands.forEach((subCommand) => {
      if (subCommand.requiredPerm && !perms.any(subCommand.requiredPerm)) {
        perms.add(subCommand.requiredPerm);
        numWithPerms += 1;
      }
    });

    if (numWithPerms === 0) {
      return undefined;
    }

    return perms;
  }

  protected registerSubCommand(command: Command): void {
    this.subCommands.set(command.name, command);
    command.aliases.forEach((alias) => {
      this.subCommands.set(alias, command);
    });
  }

  protected abstract registerSubCommands(bot: Bot): void;
}
