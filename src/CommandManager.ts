import type { Command, CommandArgument, CommandParsedType } from 'commands/Command';
// import * as commands from 'commands';
import * as modules from 'modules';
import type { Bot } from 'Bot';
// import { PermissionsHelper } from 'utils/PermissionsHelper';
import { CommandGroup } from 'commands/CommandGroup';
import { Logger } from 'Logger';

import {
  ApplicationCommandChoicesOption,
  ApplicationCommandData,
  ApplicationCommandOptionChoice,
  ApplicationCommandOptionData,
  Message, MessageEmbed, PartialMessage, Snowflake,
} from 'discord.js';
// import { HelpManager } from 'HelpManager';
import { CommandContext } from 'CommandContext';
import type { Module } from 'modules/Module';
import { ArgumentParser } from 'utils/ArgumentParser';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import { args } from 'modules/ModuleDecorators';

export class CommandManager {
  // Map guild id and command name to command, just command name for global
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

    // Ignore bot and system messages
    if (fullMessage.author?.bot || fullMessage.system) {
      return;
    }

    let prefix: string | undefined;

    if (fullMessage.guild) {
      prefix = await this.getPrefix(fullMessage.guild.id);
    } else {
      prefix = await this.getPrefix();
    }

    if (!prefix) return;

    // Make sure we have prefix
    if (!fullMessage.content?.startsWith(prefix)) {
      return;
    }

    // Split args, find command
    const split = fullMessage.content.slice(prefix.length).split(' ');
    let command = this.getCommand(fullMessage.guild?.id, split[0]);
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
    const { command: commandToRun, args } = await ArgumentParser.parseArgs(fullMessage.content.slice(prefix.length + split[0].length), command, ctx);
    if (!args) {
      // TODO: Send help
      await ctx.reply('help sent haha');
      return;
    }

    // If guild only and not in guild
    if (commandToRun.guildOnly && !fullMessage.guild) {
      return;
    }

    // Check perms
    if (!(await PermissionsHelper.checkPerms(ctx, commandToRun))) {
      return;
    }

    // Run command
    try {
      await commandToRun.invoke(ctx, args);
    } catch (err) {
      await this.logger.error(`Error running command "${commandToRun?.name}".`, err);
      await ctx.reply({
        embeds: [new MessageEmbed()
          .setColor(0xFF0000)
          .setTitle('❌ Error running command.')
          .setTimestamp(Date.now())],
      });
    }
  }

  public getCommand(guildId: Snowflake | undefined, commandToGet: string): Command | undefined {
    console.log(this.commandMap);
    return this.commandMap.get(guildId + "," + commandToGet) ?? this.commandMap.get("GLOBAL," + commandToGet);
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
    this.commandMap.set((command.guild ?? "GLOBAL") + "," + command.name, command);
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

  private deploySlashCommands() {
    let commands = this.generateSlashObjs();
    let globalCommands: ApplicationCommandData[] | undefined;

    // Deploy global commands
    // TODO: Detect changes and only deploy changed commands
    globalCommands = commands.get("GLOBAL");
    if (globalCommands) {
      this.bot.client.application.commands.set(globalCommands);
    }
    commands.delete("GLOBAL");

    // Deploy guild commands
    commands.forEach((cmds, guild) => {
      this.bot.client.guilds.cache.get(guild)?.commands.set(cmds);
    });
  }

  private generateSlashObjs(): Map<Snowflake, ApplicationCommandData[]> {
    let commands = new Map<Snowflake, ApplicationCommandData[]>();

    let currGuild: Snowflake;
    let currSlash: ApplicationCommandData;
    let currArg: ApplicationCommandOptionData;

    // Convert every command to slash command JSON
    this.commandMap.forEach((v, k) => {
      // Ignore non slash commands and subcommands
      if (!v.slash || v.parent) return;
      // TODO: Handle command groups
      if (v instanceof CommandGroup) return; 

      // TODO: Support USER and MESSAGE commands
      currSlash = { name: v.name, description: v.desc ?? "", type: "CHAT_INPUT" }
      currGuild = k.split(",")[0];

      if (!commands.has(currGuild)) {
        commands.set(currGuild, []);
      }

      if (v.args) {
        currSlash.options = [];
        v.args.forEach((arg) => {
          // Will change type later
          currArg = { 
            name: arg.name, description: arg.description ?? "", 
            type: this.bot.utils.getSlashArgType(arg.type), required: !arg.optional, 
            autocomplete: arg.autocomplete,
          }

          if (arg.choices && (currArg.type === "STRING" || currArg.type === "INTEGER" || currArg.type === "NUMBER")) {
            currArg.choices = arg.choices;
          }

          if (arg.channelTypes && currArg.type === "CHANNEL") {
            currArg.channelTypes = arg.channelTypes;
          }
        });
      }

      commands.get(currGuild)?.push(currSlash);
    });

    return commands;
  }
}
