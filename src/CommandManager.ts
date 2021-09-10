import type { Command, CommandResult } from 'commands/Command';
import * as commands from 'commands';
import type { Bot } from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import type { CommandGroup } from 'commands/CommandGroup';
import { Logger } from 'Logger';

import {
  Message, MessageEmbed, PartialMessage,
} from 'discord.js';
import { HelpManager } from 'HelpManager';

export class CommandManager {
  private commandMap: Map<string, Command>;

  private bot: Bot;

  private logger: Logger;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(bot, this);
    this.commandMap = new Map<string, Command>();
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
    const args: string[] = await CommandUtils.splitCommandArgs(fullMessage.content, prefix.length);
    const command: Command | undefined = this.getCommand(args.shift());
    // If command not found, exit
    if (command === undefined) {
      return;
    }

    // Check perms/in DM and run
    const user = fullMessage.member ?? fullMessage.author;
    const allowed = user && await PermissionsHelper.checkPermsAndDM(user, command, this.bot);
    if (allowed) {
      try {
        const result: CommandResult = await command.run(this.bot, fullMessage, args);
        if (result.sendHelp && result.command) {
          await HelpManager.sendCommandHelp(result.command, result.message, this.bot);
        }
      } catch (err) {
        await this.logger.error(`Error running command "${command.fullName}".`, err);
        await message.channel.send({
          embeds: [new MessageEmbed()
            .setColor(0xFF0000)
            .setTitle('❌ Error running command.')
            .setTimestamp(Date.now())],
        });
      }
    }
  }

  public static async parseSubCommand(group: CommandGroup, args: string[], message: Message, bot: Bot): Promise<CommandResult> {
    // Find command
    const command: Command | undefined = CommandManager.getCommandHelper(args.shift(), group.subCommands);
    // If command not found, exit
    if (command === undefined) {
      return { sendHelp: true, command: group, message };
    }

    // Check perms/in DM and run
    if (await PermissionsHelper.checkPermsAndDM(message.member ? message.member : message.author, command, bot)) {
      return command.run(bot, message, args);
    }

    return { sendHelp: false, command: null, message };
  }

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
    command.aliases.forEach((alias) => {
      this.commandMap.set(alias, command);
    });
  }

  private registerAll(): void {
    Object.values(commands).forEach((CommandToRegister) => {
      this.registerCommand(new CommandToRegister(this.bot));
    });
  }

  private static getCommandHelper(commandToGet: string | undefined, commandList: Map<string, Command>): Command | undefined {
    if (commandToGet && commandList.has(commandToGet)) {
      return commandList.get(commandToGet);
    }

    return undefined;
  }
}
