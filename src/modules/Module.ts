import type { CommandContext } from 'CommandContext';
import { Command, CommandArg, CommandOptions } from 'commands/Command';
import { CommandGroup } from 'commands/CommandGroup';

import 'reflect-metadata';

export abstract class Module {
  public readonly commands: Command[];

  constructor() {
    this.commands = [];
    this.addCommands();
  }

  private addCommands() {
    const proto = Reflect.getPrototypeOf(this);
    if (proto) {
      // For each member, check for command metadata
      Reflect.ownKeys(proto).forEach((key) => {
        const commandType: string | undefined = Reflect.getMetadata('command:type', this, key);
        // If we have a type, we have a command to register
        if (commandType) {
          const commandName: string = Reflect.getMetadata('command:name', this, key);
          const commandOptions: CommandOptions = {};

          // If we have a parent, find the group
          const commandParent: string | undefined = Reflect.getMetadata('command:parent', this, key);
          let foundGroup: CommandGroup | undefined;
          if (commandParent) {
            foundGroup = this.commands.find(
              (foundCommand) => foundCommand.name === commandParent && foundCommand instanceof CommandGroup,
            ) as CommandGroup | undefined;

            if (!commandParent) {
              throw new Error(`Could not find group ${commandParent}`);
            }
          }

          commandOptions.parent = foundGroup;
          commandOptions.argNames = Reflect.getMetadata('command:argNames', this, key);
          commandOptions.argTypes = Reflect.getMetadata('command:argTypes', this, key);

          let addedCommand: Command;

          // Create the objects and register
          if (commandType === 'command') {
            addedCommand = new Command(commandName, Reflect.get(this, key).bind(this), commandOptions);
            this.commands.push(addedCommand);
          } else if (commandType === 'group') {
            addedCommand = new CommandGroup(commandName, Reflect.get(this, key).bind(this), commandOptions);
            this.commands.push(addedCommand);
          } else {
            throw new Error('Unknown command type');
          }
          // Register subcommand in group if needed
          foundGroup?.registerSubCommand(addedCommand);
        }
      });
    } else {
      throw new Error('Something went wrong enumerating commands.');
    }
  }
}
