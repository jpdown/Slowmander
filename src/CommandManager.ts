import { Command, CommandArgument, CommandParsedType, PermissionLevel } from "commands/Command";
// import * as commands from 'commands';
import * as modules from "modules";
import type { Bot } from "Bot";
// import { PermissionsHelper } from 'utils/PermissionsHelper';
import { CommandGroup } from "commands/CommandGroup";
import { Logger } from "Logger";

import {
    ApplicationCommandSubCommand,
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
    ApplicationCommandNumericOptionData,
    ApplicationCommandAutocompleteOption,
    ApplicationCommand,
    Collection,
    ApplicationCommandManager,
    GuildApplicationCommandManager,
    SystemChannelFlags,
    GuildResolvable,
    Role,
    ApplicationCommandPermissionData,
    ApplicationCommandNonOptionsData,
    Guild,
    Permissions,
} from "discord.js";
// import { HelpManager } from 'HelpManager';
import { CommandContext } from "CommandContext";
import type { Module } from "modules/Module";
import { ArgumentParser } from "utils/ArgumentParser";
import { PermissionsHelper } from "utils/PermissionsHelper";
import type { APIInteractionGuildMember } from "discord-api-types";
import { CommandUtils } from "utils/CommandUtils";

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
            fullMessage.guild ?? undefined,
            fullMessage.member ?? undefined,
            args
            );
            
        // Check perms
        if (!(await PermissionsHelper.checkPerms(commandToRun, ctx))) {
            return;
        }
        
        if (!args) {
            // TODO: Send help
            await ctx.reply("help sent haha");
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
        if (!(interaction.member instanceof GuildMember)) {
            this.logger.warning(
                `We got an APIGuildMember\nchannel:${interaction.channelId},guild:${interaction.guildId},user:${interaction.user.id},command:${interaction.commandName}`
            );
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
            interaction.guild ?? undefined,
            interaction.member,
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

        // Respond
        await interaction.respond(filtered.map((choice) => ({ name: choice.toString(), value: choice })))
    }

    public getCommand(guildId: Snowflake | undefined, commandToGet: string): Command | undefined {
        console.log(this.commandMap);
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
        let commands = this.generateSlashObjs();
        let globalCommands: ApplicationCommandData[] | undefined;
        
        // Deploy global commands
        globalCommands = commands.get("GLOBAL");
        if (globalCommands) {
            // Fetch all commands so we can compare
            await this.bot.client.application.commands.fetch();
            await this.compareSlash(globalCommands, this.bot.client.application.commands);
        }
        commands.delete("GLOBAL");

        // Deploy guild commands
        for (let [guild, cmds] of commands) {
            let guildObj = await this.bot.client.guilds.fetch(guild);
            // Fetch all commands so we can compare
            await guildObj.commands.fetch();
            await this.compareSlash(cmds, guildObj.commands);
        }
    }

    public async deploySlashPermissions(guild: Guild | undefined) {
        let globalCmds: Map<string, [ApplicationCommand<{guild: GuildResolvable}>, Command]> = new Map();
        let currPerms: ApplicationCommandPermissionData[];
        let currGuildCmds: Map<string, [ApplicationCommand<{}>, Command]> = new Map();
        let currGuildVIPRole: Snowflake | null | undefined;
        let currGuildModRole: Snowflake | null | undefined;
        let currGuildAdminRole: Snowflake | null | undefined;
        let ownerPerms: ApplicationCommandPermissionData[] = [];
        // If given a guild, make a one element array of that guild
        let guilds = guild ? [guild] : this.bot.client.guilds.cache.values();

        // Get owners
        for (let owner of this.bot.owners) {
            ownerPerms.push({id: owner, type: "USER", permission: true});
        }

        globalCmds = await this.getSlashWithPerms(this.bot.client.application.commands, "GLOBAL");
        
        // Global commands need to deploy permissions per guild
        for (let guild of guilds) {
            // Get roles
            currGuildVIPRole = this.bot.db.guildConfigs.getVipRole(guild.id);
            currGuildModRole = this.bot.db.guildConfigs.getModRole(guild.id);
            currGuildAdminRole = this.bot.db.guildConfigs.getAdminRole(guild.id);

            // Handle global commands first
            for (let [cmdId, [slash, cmd]] of globalCmds) {
                currPerms = await this.generateSlashPerms(cmd, currGuildVIPRole, currGuildModRole, currGuildAdminRole, ownerPerms);
                slash.permissions.set({ guild: guild.id, permissions: currPerms });
            }

            // Get list of guild commands to set permissions
            currGuildCmds = await this.getSlashWithPerms(guild.commands, guild.id);
            // Deploy guild perms
            for (let [cmdId, [slash, cmd]] of currGuildCmds) {
                currPerms = await this.generateSlashPerms(cmd, currGuildVIPRole, currGuildModRole, currGuildAdminRole, ownerPerms);
                slash.permissions.set({ permissions: currPerms });
            }
        }
    }

    private async getSlashWithPerms(manager: ApplicationCommandManager | GuildApplicationCommandManager, guildId: string): Promise<Map<string, [ApplicationCommand, Command]>> {
        let cmds: Map<string, [ApplicationCommand, Command]> = new Map();
        for (let cmd of manager.cache.values()) {
            let localCmd = this.commandMap.get(guildId + "," + cmd.name);
            if (!localCmd) {
                this.logger.error(`Slash command exists that we don't have. ${guildId} command ${cmd.name}.`);
                continue;
            }

            // We only need to set perms if not an everyone command
            if (localCmd.permLevel > PermissionLevel.Everyone) {
                cmds.set(cmd.name, [cmd, localCmd]);
            }
        }

        return cmds;
    }

    private async generateSlashPerms(cmd: Command, vipRole: Snowflake | null | undefined, modRole: Snowflake | null | undefined, adminRole: Snowflake | null | undefined, ownerPerms: ApplicationCommandPermissionData[]): Promise<ApplicationCommandPermissionData[]> {
        let currPerms: ApplicationCommandPermissionData[] = [];
        // Always allow owners
        currPerms = currPerms.concat(ownerPerms);

        if (cmd.permLevel <= PermissionLevel.VIP && vipRole) {
            currPerms.push({ id: vipRole, type: "ROLE", permission: true })
        }
        if (cmd.permLevel <= PermissionLevel.Mod && modRole) {
            currPerms.push({ id: modRole, type: "ROLE", permission: true })
        }
        if (cmd.permLevel <= PermissionLevel.Admin && adminRole) {
            currPerms.push({ id: adminRole, type: "ROLE", permission: true })
        }

        // Deploy
        return currPerms;
    }

    private async compareSlash(gen: ApplicationCommandData[], manager: ApplicationCommandManager | GuildApplicationCommandManager) {
        let existingCmd: ApplicationCommand | undefined;
        let compared: Snowflake[] = [];
        for (let cmd of gen) {
            // This is gross but idk if it's any better than the alternative of making a new map
            existingCmd = manager.cache.find((appCmd) => appCmd.name === cmd.name);
            if (!existingCmd?.equals(cmd)) {
                if (existingCmd) {
                    await existingCmd.edit(cmd);
                }
                else {
                    existingCmd = await manager.create(cmd);
                }
            }
            compared.push(existingCmd.id);
        };

        // Remove all commands that no longer exist
        let toRemove = manager.cache.filter((cmd) => !compared.includes(cmd.id));
        for (let [id, cmd] of toRemove) {
            await manager.delete(cmd);
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
        this.commandMap.forEach((v, k) => {
            // Ignore non slash commands and subcommands
            if (!v.slash || v.parent) return;

            // TODO: Support USER and MESSAGE commands
            currSlash = {
                name: v.name,
                description: v.desc ?? "",
                type: "CHAT_INPUT",
            };

            if (v.permLevel > PermissionLevel.Everyone) {
                currSlash.defaultPermission = false;
            }

            currGuild = k.split(",")[0];

            if (!commands.has(currGuild)) {
                commands.set(currGuild, []);
            }

            if (v.args) {
                currSlash.options = this.getSlashArgs(v);
            } else if (v instanceof CommandGroup) {
                currSlash.options = this.getSlashSubs(v);
            }

            commands.get(currGuild)?.push(currSlash);
        });

        return commands;
    }

    private getSlashSubs(
        group: CommandGroup
    ): (ApplicationCommandSubCommandData | ApplicationCommandSubGroupData)[] {
        const subs: (ApplicationCommandSubCommandData | ApplicationCommandSubGroupData)[] = [];
        let currSub: ApplicationCommandSubCommandData | ApplicationCommandSubGroupData;

        group.subCommands.forEach((sub) => {
            if (sub instanceof CommandGroup) {
                currSub = {
                    type: "SUB_COMMAND_GROUP",
                    name: sub.name,
                    description: sub.desc,
                };
                // We can do this because subgroups cannot contain subgroups
                currSub.options = this.getSlashSubs(sub) as ApplicationCommandSubCommandData[];
            } else {
                currSub = {
                    type: "SUB_COMMAND",
                    name: sub.name,
                    description: sub.desc,
                };
                currSub.options = this.getSlashArgs(sub);
            }
            subs.push(currSub);
        });

        return subs;
    }

    // prettier-ignore
    private getSlashArgs(cmd: Command): | Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>[] | undefined {
        let args: Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>[] = [];
        cmd.args?.forEach((arg) => {
            // Will change type later
            let type = CommandUtils.getSlashArgType(arg.type);
            let currArg: Exclude<ApplicationCommandOptionData, | ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>;
            if ("autocomplete" in arg) {
                currArg = {
                    name: arg.name,
                    description: arg.description ?? "",
                    type: type as "STRING" | "NUMBER" | "INTEGER", // TODO: Better way to check this?
                    required: !arg.optional,
                    autocomplete: true
                };
            }
            else if ("choices" in arg) {
                currArg = {
                    name: arg.name,
                    description: arg.description ?? "",
                    type: type as "STRING" | "NUMBER" | "INTEGER", // TODO: Better way to check this?
                    required: !arg.optional,
                    choices: arg.choices
                };
            }
            else if ("channelTypes" in arg) {
                currArg = {
                    name: arg.name,
                    description: arg.description ?? "",
                    type: type as "CHANNEL", // TODO: Better way to check this?
                    required: !arg.optional,
                    channelTypes: arg.channelTypes
                };
            }
            else if ("maxValue" in arg || "minValue" in arg) {
                currArg = {
                    name: arg.name,
                    description: arg.description ?? "",
                    type: type as "NUMBER" | "INTEGER", // TODO: Better way to check this?
                    required: !arg.optional,
                    maxValue: arg.maxValue,
                    minValue: arg.minValue
                };
            }
            else {
                currArg = {
                    name: arg.name,
                    description: arg.description ?? "",
                    type: type,
                    required: !arg.optional,
                } as ApplicationCommandNonOptionsData; // TODO: Better way to do this?
            }

            args.push(currArg);
        });

        return args.length > 0 ? args : undefined;
    }
}
