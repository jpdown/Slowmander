import type { Bot } from 'Bot';
import { Command, CommandOptions, PermissionLevel } from 'commands/Command';
import { CommandGroup } from 'commands/CommandGroup';

import 'reflect-metadata';

export abstract class Module {
  public readonly commands: Command[];

  protected readonly bot: Bot;

  constructor(bot: Bot) {
    this.commands = [];
    this.addCommands();

    this.bot = bot;
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
          const commandDesc: string = Reflect.getMetadata('command:desc', this, key);
          const commandOptions: CommandOptions = {};

          // If we have a parent, find the group
          const commandParent: string | undefined = Reflect.getMetadata('command:parent', this, key);
          let foundGroup: CommandGroup | undefined;
          if (commandParent) {
            foundGroup = this.commands.find(
              (foundCommand) => foundCommand.name === commandParent && foundCommand instanceof CommandGroup,
            ) as CommandGroup | undefined;

            if (!foundGroup) {
              throw new Error(`Could not find group ${commandParent}`);
            }
          }

          commandOptions.parent = foundGroup;
          commandOptions.args = Reflect.getMetadata('command:args', this, key);
          commandOptions.guild = Reflect.getMetadata('command:guild', this, key);
          commandOptions.guildOnly = Reflect.getMetadata('command:guildOnly', this, key);
          commandOptions.slash = Reflect.getMetadata('command:slash', this, key) ?? true;

          let addedCommand: Command;
          let permLevel: PermissionLevel = Reflect.getMetadata('command:permLevel', this, key) ?? PermissionLevel.Everyone;
          // TODO: Should this just copy parent's permLevel instead? Is it better to overspecify or underspecify here?
          if (commandOptions.parent && permLevel !== commandOptions.parent.permLevel) {
            throw new Error("Command children cannot have different permLevel to their parent.")
          }

          // Create the objects and register
          if (commandType === 'command') {
            addedCommand = new Command(commandName, commandDesc, Reflect.get(this, key).bind(this), permLevel, commandOptions);
          } 
          else if (commandType === 'group') {
            if (commandOptions.args) {
              throw new Error('Command groups cannot have arguments.')
            }
            if (commandOptions.parent && commandOptions.parent.parent) {
              throw new Error("Command subgroups cannot have children.");
            }
            addedCommand = new CommandGroup(commandName, commandDesc, Reflect.get(this, key).bind(this), permLevel, commandOptions);
          } 
          else {
            throw new Error('Unknown command type');
          }
            
          this.commands.push(addedCommand);
          // Register subcommand if needed
          commandOptions.parent?.registerSubCommand(addedCommand);
        }
      });
    } else {
      throw new Error('Something went wrong enumerating commands.');
    }
  }
}
