import type { Command, CommandArgument, CommandParsedType } from 'commands/Command';
// import * as commands from 'commands';
import * as modules from 'modules';
import type { Bot } from 'Bot';
// import { PermissionsHelper } from 'utils/PermissionsHelper';
import { CommandGroup } from 'commands/CommandGroup';
import { Logger } from 'Logger';

import {
  Message, MessageEmbed, PartialMessage, Snowflake,
} from 'discord.js';
// import { HelpManager } from 'HelpManager';
import { CommandContext } from 'CommandContext';
import type { Module } from 'modules/Module';
import { ArgumentParser } from 'utils/ArgumentParser';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import { SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandUserOption } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types';

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
    const globalCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];
    const guildCommands = new Map<Snowflake, RESTPostAPIApplicationCommandsJSONBody[]>();
    let currGuild: Snowflake;
    let currSlash: SlashCommandBuilder;

    // Convert every command to slash command JSON
    this.commandMap.forEach((v, k) => {
      // Ignore non slash commands and subcommands
      if (!v.slash || v.parent) return;

      currGuild = k.split(",")[0];

      // TODO: Handle command groups
      currSlash = new SlashCommandBuilder();
      currSlash.setName(v.name);

      if (v.desc) {
        currSlash.setDescription(v.desc);
      }

      if (v.args) {
        v.args.forEach((arg) => {
          switch(arg.type) {
            case "bool":
              new SlashCommand
          }
        });
      }
    });
  }

  private slashAddString(arg: CommandArgument, slash: SlashCommandBuilder) {
    const strOption = new SlashCommandStringOption();
    strOption.setName(arg.name);
    strOption.setDescription(arg.description ?? "");
    strOption.setRequired(!arg.optional);

    if (arg.choices) {
      strOption.addChoices(arg.choices as [name: string, value: string][]);
    }

    return strOption;
  }

  private slashAddInt(arg: CommandArgument, slash: SlashCommandBuilder) {
    const intOption = new SlashCommandIntegerOption();
    intOption.setName(arg.name);
    intOption.setDescription(arg.description ?? "");
    intOption.setRequired(!arg.optional);

    if (arg.choices) {
      intOption.addChoices(arg.choices as [name: string, value: number][]);
    }

    return intOption;
  }

  private slashAddNumber(arg: CommandArgument, slash: SlashCommandBuilder) {
    const numOption = new SlashCommandNumberOption();
    numOption.setName(arg.name);
    numOption.setDescription(arg.description ?? "");
    numOption.setRequired(!arg.optional);

    if (arg.choices) {
      numOption.addChoices(arg.choices as [name: string, value: number][]);
    }

    return numOption;
  }

  private slashAddBool(arg: CommandArgument, slash: SlashCommandBuilder) {
    const boolOption = new SlashCommandBooleanOption();
    boolOption.setName(arg.name);
    boolOption.setDescription(arg.description ?? "");
    boolOption.setRequired(!arg.optional);

    return boolOption;
  }

  private slashAddUser(arg: CommandArgument, slash: SlashCommandBuilder) {
    const userOption = new SlashCommandUserOption();
    userOption.setName(arg.name);
    userOption.setDescription(arg.description ?? "");
    userOption.setRequired(!arg.optional);

    return userOption;
  }

  private slashAddChannel(arg: CommandArgument, slash: SlashCommandBuilder) {
    const channelOption = new SlashCommandChannelOption();
    channelOption.setName(arg.name);
    channelOption.setDescription(arg.description ?? "");
    channelOption.setRequired(!arg.optional);

    if (arg.channelTypes) {
      channelOption.addChannelTypes(arg.channelTypes);
    }

    return channelOption;
  }

  private slashAddRole(arg: CommandArgument, slash: SlashCommandBuilder) {
    const roleOption = new SlashCommandRoleOption();
    roleOption.setName(arg.name);
    roleOption.setDescription(arg.description ?? "");
    roleOption.setRequired(!arg.optional);

    return roleOption;
  }
}
