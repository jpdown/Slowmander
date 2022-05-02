import { Command, CommandArgumentType, PermissionLevel } from "commands/Command";
import * as modules from "modules";
import type { Bot } from "Bot";
import { CommandGroup } from "commands/CommandGroup";
import { Logger } from "Logger";

import {
    ApplicationCommandData,
    GuildMember,
    Interaction,
    Message,
    MessageEmbed,
    PartialMessage,
    Snowflake,
    ApplicationCommandSubCommandData,
    ApplicationCommandSubGroupData,
    ApplicationCommandOptionData,
    ApplicationCommand,
    ApplicationCommandManager,
    GuildApplicationCommandManager,
    GuildResolvable,
    ApplicationCommandPermissionData,
    ApplicationCommandNonOptionsData,
    Guild,
    Permissions,
    ApplicationCommandOptionType,
} from "discord.js";
import { CommandContext } from "CommandContext";
import type { Module } from "modules/Module";
import { ArgumentParser } from "utils/ArgumentParser";
import { PermissionsHelper } from "utils/PermissionsHelper";
import { CommandUtils } from "utils/CommandUtils";
import { HelpManager } from "HelpManager";
import { SlashCommandBuilder, SlashCommandRoleOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { APIApplicationCommandOptionChoice, RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord-api-types/v10";
import { REST } from "@discordjs/rest";

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
            await this.logger.warning("Error fetching message.", err);
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

        // If user doesn't have slash command perms, ignore
        if (message.member && !message.member.permissionsIn(message.channelId).has(Permissions.FLAGS.USE_APPLICATION_COMMANDS)) {
            return;
        }

        // Split args, find command
        const split = fullMessage.content.slice(prefix.length).split(" ");
        let command = this.getCommand(fullMessage.guild?.id, split[0]);
        // If command not found, exit
        if (command === undefined) {
            return;
        }
        
        
        // Parse arguments
        const { command: commandToRun, args } = await ArgumentParser.parseArgs(
            fullMessage.content.slice(prefix.length + split[0].length),
            command,
            this.bot,
            fullMessage.guild ?? undefined
        );
            
        // If guild only and not in guild
        if (commandToRun.guildOnly && !fullMessage.guild) {
            return;
        }

        // Build ctx
        const ctx = new CommandContext(
            this.bot,
            this.bot.client,
            fullMessage,
            fullMessage.author,
            fullMessage.channel,
            commandToRun,
            fullMessage.guild ?? undefined,
            fullMessage.member ?? undefined,
            args
            );
            
        // Check perms
        if (!(await PermissionsHelper.checkPerms(commandToRun, ctx))) {
            return;
        }
        
        if (!args) {
            await HelpManager.sendCommandHelp(commandToRun, ctx);
            return;
        }


        // Run command
        try {
            await commandToRun.invoke(ctx, args);
        } catch (err) {
            await this.logger.error(`Error running command "${commandToRun?.name}".`, err);
            await ctx.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setTitle("❌ Error running command.")
                        .setTimestamp(Date.now()),
                ],
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

        let cmd = this.getCommand(interaction.guildId ?? undefined, interaction.commandName);
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
        if (interaction.member && !(interaction.member instanceof GuildMember)) {
            this.logger.warning(
                `We got an APIGuildMember\nchannel:${interaction.channelId},guild:${interaction.guildId},user:${interaction.user.id},command:${interaction.commandName}`
            );
            return;
        }

        // If owner only command, only allow owners
        if (cmd.permLevel === PermissionLevel.Owner && !this.bot.owners.includes(interaction.user.id)) {
            return;
        }

        // Warn if the interaction does not have a channel
        if (!interaction.channel) {
            this.logger.warning(
                `We got a command interaction with no channel\nguild:${interaction.guildId},user:${interaction.user.id},command:${interaction.commandName}`
            );
            return;
        }

        // Parse arguments
        const args = await ArgumentParser.parseSlashArgs(interaction.options, cmd);
        if (!args) {
            return;
        }

        // Build ctx
        const ctx = new CommandContext(
            this.bot,
            this.bot.client,
            interaction,
            interaction.user,
            interaction.channel,
            cmd,
            interaction.guild ?? undefined,
            interaction.member ?? undefined,
            args
        );

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
                embeds: [
                    new MessageEmbed()
                        .setColor(0xff0000)
                        .setTitle("❌ Error running command.")
                        .setTimestamp(Date.now()),
                ],
            });
        }
    }

    public async handleAutocomplete(interaction: Interaction): Promise<void> {
        if (!interaction.isAutocomplete()) {
            return;
        }

        // Get command
        let subGroup = interaction.options.getSubcommandGroup(false);
        let subCmd = interaction.options.getSubcommand(false);

        let cmd = this.getCommand(interaction.guildId ?? undefined, interaction.commandName);
        if (subGroup && cmd instanceof CommandGroup) {
            cmd = cmd.getSubCommand(subGroup);
        }
        if (subCmd && cmd instanceof CommandGroup) {
            cmd = cmd.getSubCommand(subCmd);
        }
        if (!cmd) {
            return;
        }

        // Find the focused option
        let focused = interaction.options.getFocused(true);

        // Get arg and get array from function
        let arg = cmd.args?.find((v) => v.name === focused.name);
        // Arg should be an autocomplete
        if (!arg || !("autocomplete" in arg)) {
            return;
        }

        // Filter by starts with
        let arr = await arg.autocompleteFunc(interaction.channel!, interaction.user, interaction.guildId, this.bot);
        let filtered: string[] | number[];
        if (arg.type === "string") {
            filtered = (arr as string[]).filter((choice) => choice.startsWith(focused.value as string));
        }
        else {
            filtered = (arr as number[]).filter((choice) => choice.toString().startsWith((focused.value as number).toString()))
        }
        filtered = filtered.slice(0, 25); // Discord has limit of 25 choices

        // Respond
        await interaction.respond(filtered.map((choice) => ({ name: choice.toString(), value: choice })))
    }

    public getCommand(guildId: Snowflake | undefined, commandToGet: string): Command | undefined {
        return (
            this.commandMap.get(guildId + "," + commandToGet) ??
            this.commandMap.get("GLOBAL," + commandToGet)
        );
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
        let commands = this.generateSlash();
        let globalCommands: SlashCommand[] | undefined;
        
        // Deploy global commands
        globalCommands = commands.get("GLOBAL");
        if (globalCommands) {
            // Fetch all commands so we can compare
            await this.compareSlash(globalCommands, 'GLOBAL');
        }
        commands.delete("GLOBAL");

        // Deploy guild commands
        for (let [guild, cmds] of commands) {
            // Fetch all commands so we can compare
            await this.compareSlash(cmds, guild);
        }
    }

    private async compareSlash(gen: SlashCommand[], guildId: Snowflake) {
        // TODO: actually compare cmds
        const clientId = this.bot.client.application.id;
        if (guildId === 'GLOBAL') {
            await this.bot.rest.put(Routes.applicationCommands(clientId), { body: gen });
            this.logger.info('deployed global')
            console.log(gen)
        } else {
            await this.bot.rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: gen });
            this.logger.info(`deployed ${guildId}`, gen)
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

    private generateSlash(): Map<Snowflake, SlashCommand[]> {
        let commands = new Map<Snowflake, SlashCommand[]>();

        let currGuild: Snowflake;
        let currSlash: SlashCommandBuilder;
        let currJSON: SlashCommand;

        this.commandMap.forEach((v, k) => {
            if (!v.slash || v.parent) return;

            currSlash = new SlashCommandBuilder()
                .setName(v.name)
                .setDescription(v.desc)
            
            currGuild = k.split(",")[0];
            if (!commands.has(currGuild)) {
                commands.set(currGuild, []);
            }

            if (v.args) {
                this.buildCmdArgs(currSlash, v);
            } else if (v instanceof CommandGroup) {
                this.setSlashSubs(currSlash, v);
            }

            currJSON = currSlash.toJSON();
            if (v.guildOnly) {
                console.log('setting dm permission')
                currJSON['dm_permission'] = false;
            }
            // TODO: Required perms
            commands.get(currGuild)?.push(currJSON);
        });

        return commands;
    }

    private setSlashSubs(slash: SlashCommandBuilder, group: CommandGroup) {
        group.subCommands.forEach((sub) => {
            if (sub instanceof CommandGroup) {
                slash.addSubcommandGroup(this.buildSubGroup(sub));
            } else {
                slash.addSubcommand((option) => {
                    option.setName(sub.name)
                        .setDescription(sub.desc);
                    this.buildCmdArgs(option, sub);
                    return option;
                })
            }
        })
    }

    private buildSubGroup(group: CommandGroup): SlashCommandSubcommandGroupBuilder {
        const subGroup = new SlashCommandSubcommandGroupBuilder()
            .setName(group.name)
            .setDescription(group.desc);

        group.subCommands.forEach((sub) => {
            subGroup.addSubcommand(this.buildSubCommand(sub));
        })

        return subGroup;
    }

    private buildSubCommand(cmd: Command): SlashCommandSubcommandBuilder {
        const subCmd = new SlashCommandSubcommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.desc)
        this.buildCmdArgs(subCmd, cmd);

        return subCmd;
    }

    private buildCmdArgs(slash: SlashCommandBuilder | SlashCommandSubcommandBuilder, cmd: Command) {
        let type: Exclude<
            ApplicationCommandOptionType,
            "SUB_COMMAND" | "SUB_COMMAND_GROUP"
        >;
        cmd.args?.forEach((arg) => {
            type = CommandUtils.getSlashArgType(arg.type);
            switch(type) {
                case 'STRING':
                    slash.addStringOption((option) => {
                        option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(!arg.optional)
                        
                        if ("autocomplete" in arg) {
                            option.setAutocomplete(true);
                        } else if ("choices" in arg) {
                            option.addChoices(...arg.choices as APIApplicationCommandOptionChoice<string>[])
                        }

                        return option;
                    })
                    break;
                case 'INTEGER':
                    slash.addIntegerOption((option) => {
                        option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(!arg.optional)
                        
                        if ("autocomplete" in arg) {
                            option.setAutocomplete(true);
                        } else if ("choices" in arg) {
                            option.addChoices(...arg.choices as APIApplicationCommandOptionChoice<number>[])
                        } 
                        if ("maxValue" in arg) {
                            option.setMaxValue(arg.maxValue!);
                        }
                        if ("minValue" in arg) {
                            option.setMinValue(arg.minValue!);
                        }

                        return option;
                    })
                    break;
                case 'NUMBER':
                    slash.addNumberOption((option) => {
                        option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(!arg.optional)
                        
                        if ("autocomplete" in arg) {
                            option.setAutocomplete(true);
                        } else if ("choices" in arg) {
                            option.addChoices(...arg.choices as APIApplicationCommandOptionChoice<number>[])
                        } 
                        if ("maxValue" in arg) {
                            option.setMaxValue(arg.maxValue!);
                        }
                        if ("minValue" in arg) {
                            option.setMinValue(arg.minValue!);
                        }

                        return option;
                    })
                    break;
                case 'BOOLEAN':
                    slash.addBooleanOption((option) =>
                        option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(!arg.optional)
                    )
                    break;
                case 'USER':
                    slash.addUserOption((option) => 
                        option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(!arg.optional)
                    )
                    break;
                case 'CHANNEL':
                    slash.addChannelOption((option) => {
                        option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(!arg.optional)
                        
                        if ("channelTypes" in arg) {
                            option.addChannelTypes(arg.channelTypes!);
                        }

                        return option;
                    })
                    break;
                case 'ROLE':
                    slash.addRoleOption((option) => 
                        option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(!arg.optional)
                    )
                    break;
                case 'MENTIONABLE':
                    slash.addMentionableOption((option) => 
                        option.setName(arg.name)
                            .setDescription(arg.description)
                            .setRequired(!arg.optional)
                    )
                    break;
                default:
                    const exhaustiveCheck: never = type;
                    throw new Error('Unhandled arg type: ' + exhaustiveCheck);
            }
        })
    }
}

type SlashCommand = RESTPostAPIApplicationCommandsJSONBody & { dm_permission?: Boolean };