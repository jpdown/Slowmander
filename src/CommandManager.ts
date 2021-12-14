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
  ApplicationCommandSubCommandData,
  ApplicationCommandSubGroupData,
  GuildMember,
  Interaction,
  Message, MessageEmbed, PartialMessage, Snowflake,
} from 'discord.js';
// import { HelpManager } from 'HelpManager';
import { CommandContext } from 'CommandContext';
import type { Module } from 'modules/Module';
import { ArgumentParser } from 'utils/ArgumentParser';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import type { APIInteractionGuildMember } from 'discord-api-types';

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
      this.bot, this.bot.client, fullMessage, fullMessage.author, fullMessage.channel,
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

  public async handleSlash(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) {
      return;
    }
    
    // Get command
    let subGroup = interaction.options.getSubcommandGroup(false);
    let subCmd = interaction.options.getSubcommand(false);

    let cmd = this.getCommand(interaction.guildId, interaction.commandName);
    if (subGroup && cmd instanceof CommandGroup) {
      cmd = cmd.getSubCommand(subGroup);
    }
    if (subCmd && cmd instanceof CommandGroup) {
      cmd = cmd.getSubCommand(subCmd);
    }
    if (!cmd) {
      return;
    }

    // Warn me if we get an APIGuildMember
    if (!(interaction.member instanceof GuildMember)) {
      this.logger.warning(`We got an APIGuildMember\nchannel:${interaction.channelId},guild:${interaction.guildId},user:${interaction.user.tag},command:${interaction.commandName}`);
      return;
    }

    // Build ctx
    const ctx = new CommandContext(
      this.bot, this.bot.client, interaction, interaction.user, 
      interaction.channel ?? undefined, interaction.guild ?? undefined, interaction.member
    );

    // Parse arguments
    const args = await ArgumentParser.parseSlashArgs(interaction.options, cmd);
    if (!args) {
      return;
    }

    // If guild only and not in guild
    if (cmd.guildOnly && !interaction.inGuild()) {
      return;
    }

    // Run command
    try {
      await cmd.invoke(ctx, args);
    } catch (err) {
      await this.logger.error(`Error running command "${cmd?.name}".`, err);
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

  public async deploySlashCommands() {
    let commands = this.generateSlashObjs();
    let globalCommands: ApplicationCommandData[] | undefined;

    // Deploy global commands
    // TODO: Detect changes and only deploy changed commands
    globalCommands = commands.get("GLOBAL");
    if (globalCommands) {
      await this.bot.client.application.commands.set(globalCommands);
    }
    commands.delete("GLOBAL");

    // Deploy guild commands
    for (let [guild, cmds] of commands) {
      await this.bot.client.guilds.cache.get(guild)?.commands.set(cmds);
    }
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
      this.modules.push(new ModuleToRegister(this.bot));
    });

    // Register every command from every module
    this.modules.forEach((module) => {
      module.commands.forEach((command) => {
        this.registerCommand(command);
      });
    });
  }


  private generateSlashObjs(): Map<Snowflake, ApplicationCommandData[]> {
    let commands = new Map<Snowflake, ApplicationCommandData[]>();

    let currGuild: Snowflake;
    let currSlash: ApplicationCommandData;

    // Convert every command to slash command JSON
    // TODO: Add permissions
    this.commandMap.forEach((v, k) => {
      // Ignore non slash commands and subcommands
      if (!v.slash || v.parent) return;

      // TODO: Support USER and MESSAGE commands
      currSlash = { name: v.name, description: v.desc ?? "", type: "CHAT_INPUT" }
      currGuild = k.split(",")[0];

      if (!commands.has(currGuild)) {
        commands.set(currGuild, []);
      }

      if (v.args) {
        currSlash.options = this.getSlashArgs(v);
      }
      else if (v instanceof CommandGroup) {
        currSlash.options = this.getSlashSubs(v);
      }

      commands.get(currGuild)?.push(currSlash);
    });

    return commands;
  }

  private getSlashSubs(group: CommandGroup): (ApplicationCommandSubCommandData | ApplicationCommandSubGroupData)[] {
    const subs: (ApplicationCommandSubCommandData | ApplicationCommandSubGroupData)[] = [];
    let currSub: ApplicationCommandSubCommandData | ApplicationCommandSubGroupData;

    group.subCommands.forEach((sub) => {
      if (sub instanceof CommandGroup) {
        currSub = {
          type: "SUB_COMMAND_GROUP", name: sub.name, description: sub.desc
        };
        // We can do this because subgroups cannot contain subgroups
        currSub.options = this.getSlashSubs(sub) as ApplicationCommandSubCommandData[];
      }
      else {
        currSub = {
          type: "SUB_COMMAND", name: sub.name, description: sub.desc
        };
        currSub.options = this.getSlashArgs(sub);
      }
      subs.push(currSub);
    });

    return subs;
  }

  private getSlashArgs(cmd: Command): Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>[] | undefined {
    let args: Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>[] = [];
    cmd.args?.forEach((arg) => {
      // Will change type later
      let currArg: Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData> = { 
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

      args.push(currArg);
    });

    return args.length > 0 ? args : undefined;
  }
}
