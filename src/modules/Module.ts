import type { CommandContext } from 'CommandContext';
import { Command } from 'commands/Command';
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
      Reflect.ownKeys(proto).forEach((key) => {
        const commandType: string | undefined = Reflect.getMetadata('command:type', this, key);
        if (commandType) {
          const commandName: string = Reflect.getMetadata('command:name', this, key);

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

          let addedCommand: Command;

          if (commandType === 'command') {
            addedCommand = new Command(commandName, Reflect.get(this, key).bind(this), foundGroup);
            this.commands.push(addedCommand);
          } else if (commandType === 'group') {
            addedCommand = new CommandGroup(commandName, Reflect.get(this, key).bind(this), foundGroup);
            this.commands.push(addedCommand);
          } else {
            throw new Error('Unknown command type');
          }
          foundGroup?.registerSubCommand(addedCommand);
        }
      });
    } else {
      throw new Error('Something went wrong enumerating commands.');
    }
  }
}

export function command(name?: string) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'command', target, propertyKey);
  };
}

export function subcommand(parent: (ctx: CommandContext, ...args: any[]) => Promise<void>, name?: string) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'command', target, propertyKey);
    Reflect.defineMetadata('command:parent', parent.name, target, propertyKey);
  };
}

export function group(name?: string) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'group', target, propertyKey);
  };
}

export function subgroup(parent: (ctx: CommandContext, ...args: any[]) => Promise<void>, name?: string) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'group', target, propertyKey);
    Reflect.defineMetadata('command:parent', parent.name, target, propertyKey);
  };
}
