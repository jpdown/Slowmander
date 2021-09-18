import type { Command, CommandParsedType } from 'commands/Command';
// import * as commands from 'commands';
import * as modules from 'modules';
import type { Bot } from 'Bot';
// import { PermissionsHelper } from 'utils/PermissionsHelper';
import { CommandGroup } from 'commands/CommandGroup';
import { Logger } from 'Logger';

import {
  Message, MessageEmbed, PartialMessage,
} from 'discord.js';
// import { HelpManager } from 'HelpManager';
import { CommandContext } from 'CommandContext';
import type { Module } from 'modules/Module';
import { ArgumentParser } from 'utils/ArgumentParser';

export class CommandManager {
  private commandMap: Map<string, Command>;

  private modules: Module[];

  private bot: Bot;

  private logger: Logger;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(this);
    this.commandMap = new Map<string, Command>();
    this.modules = [];
    this.registerAll();
  }

  public async parseCommand(message: Message | PartialMessage): Promise<void> {
    let fullMessage: Message;
    // Handle partial events
    try {
      if (message.partial) {
        fullMessage = await message.fetch();
      } else {
        fullMessage = message;
      }
    } catch (err) {
      await this.logger.warning('Error fetching message.', err);
      return;
    }

    let prefix: string | undefined;

    if (fullMessage.guild) {
      prefix = await this.getPrefix(fullMessage.guild.id);
    } else {
      prefix = await this.getPrefix();
    }

    if (!prefix) return;

    // Ignore bot and system messages
    if (fullMessage.author?.bot || fullMessage.system) {
      return;
    }

    // Make sure we have prefix
    if (!fullMessage.content?.startsWith(prefix)) {
      return;
    }

    // Split args, find command
    // TODO: Replace with new arg parser
    const split = fullMessage.content.slice(prefix.length).split(' ');
    let command = this.getCommand(split[0]);
    // If command not found, exit
    if (command === undefined) {
      return;
    }

    // Build ctx
    const ctx = new CommandContext(
      this.bot, this.bot.client, fullMessage, fullMessage.channel, fullMessage.author,
      fullMessage.guild ?? undefined, fullMessage.member ?? undefined,
    );

    // Parse arguments
    let args: CommandParsedType[] | undefined;
    if (command.args) {
      args = await ArgumentParser.parseArgs(fullMessage.content.slice(prefix.length + split[0].length), command.args, ctx);
      if (!args) {
        // TODO: Send help
        return;
      }
    }

    // Check perms/in DM and run
    // const user = fullMessage.member ?? fullMessage.author;
    // const allowed = user && await PermissionsHelper.checkPermsAndDM(user, command, this.bot);
    // if (allowed) {
    //   try {
    //     const result: CommandResult = await command.run(this.bot, fullMessage, args);
    //     if (result.sendHelp && result.command) {
    //       await HelpManager.sendCommandHelp(result.command, result.message, this.bot);
    //     }
    //   } catch (err) {
    //     await this.logger.error(`Error running command "${command.fullName}".`, err);
    //     await message.channel.send({
    //       embeds: [new MessageEmbed()
    //         .setColor(0xFF0000)
    //         .setTitle('❌ Error running command.')
    //         .setTimestamp(Date.now())],
    //     });
    //   }
    // }

    // run command
    try {
      await command.invoke(ctx, args);
      // TODO: Replace with recursion in arg parsing
      // while (command instanceof CommandGroup && args.length > 0) {
      //   command = command.getSubCommand(args.shift()!);
      //   await command?.invoke(ctx, args);
      // }
    } catch (err) {
      await this.logger.error(`Error running command "${command?.name}".`, err);
      await message.channel.send({
        embeds: [new MessageEmbed()
          .setColor(0xFF0000)
          .setTitle('❌ Error running command.')
          .setTimestamp(Date.now())],
      });
    }
  }

  // public static async parseSubCommand(group: CommandGroup, args: string[], message: Message, bot: Bot): Promise<CommandResult> {
  //   // Find command
  //   const command: Command | undefined = CommandManager.getCommandHelper(args.shift(), group.subCommands);
  //   // If command not found, exit
  //   if (command === undefined) {
  //     return { sendHelp: true, command: group, message };
  //   }

  //   // // Check perms/in DM and run
  //   // if (await PermissionsHelper.checkPermsAndDM(message.member ? message.member : message.author, command, bot)) {
  //   //   return command.run(bot, message, args);
  //   // }

  //   return { sendHelp: false, command: null, message };
  // }

  public getCommand(commandToGet: string | undefined): Command | undefined {
    return CommandManager.getCommandHelper(commandToGet, this.commandMap);
  }

  public getAllCommands(): Command[] {
    const commandList: Command[] = [];
    this.commandMap.forEach((v) => {
      if (!commandList.includes(v)) {
        commandList.push(v);
      }
    });

    return commandList;
  }

  public async getPrefix(guildId?: string): Promise<string> {
    if (guildId) {
      const prefix = this.bot.db.guildConfigs.getPrefix(guildId);
      if (prefix) {
        return prefix;
      }
    }

    return this.bot.config.prefix;
  }

  private registerCommand(command: Command) {
    this.commandMap.set(command.name, command);
    // command.aliases.forEach((alias) => {
    //   this.commandMap.set(alias, command);
    // });
  }

  private registerAll(): void {
    // Register every module
    Object.values(modules).forEach((ModuleToRegister) => {
      this.modules.push(new ModuleToRegister());
    });

    // Register every command from every module
    this.modules.forEach((module) => {
      module.commands.forEach((command) => {
        this.registerCommand(command);
      });
    });
  }

  private static getCommandHelper(commandToGet: string | undefined, commandList: Map<string, Command>): Command | undefined {
    if (commandToGet && commandList.has(commandToGet)) {
      return commandList.get(commandToGet);
    }

    return undefined;
  }
}
