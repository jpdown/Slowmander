import {
  Command, PermissionLevel, CommandResult, CommandParameters,
} from 'commands/Command';
import { Bot } from 'Bot';

import { Message, PermissionResolvable, Permissions } from 'discord.js';

export default abstract class CommandGroup extends Command {
  protected readonly subCommands: Map<string, Command>;

  constructor(name: string, desc: string, bot: Bot, params: CommandParameters = {}) {
    const newParams = params;
    newParams.usage = '<subcommand>';
    super(name, PermissionLevel.Owner, desc, bot, newParams);
    this.subCommands = new Map<string, Command>();
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    return bot.commandManager.parseSubCommand(this, args, message, bot);
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
    let perms: Permissions | undefined = new Permissions();
    let numWithPerms = 0;

    for (const subCommand of this._subCommands.values()) {
      if (subCommand.requiredPerm && !perms.any(subCommand.requiredPerm)) {
        perms.add(subCommand.requiredPerm);
        numWithPerms++;
      }
    }

    if (numWithPerms === 0) {
      perms = undefined;
    }

    return perms;
  }

  protected registerSubCommand(command: Command): void {
    this._subCommands.set(command.name, command);
    for (const alias of command.aliases) {
      this._subCommands.set(alias, command);
    }
  }

  protected abstract registerSubCommands(bot: Bot): void;
}
