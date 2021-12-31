import type { Command, CommandArgument, CommandParsedType } from "commands/Command";
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

        if (!args) {
            // TODO: Send help
            await ctx.reply("help sent haha");
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
            // TODO: Make sure this method of getting global commands actually works
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
                    // TODO: ensure this properly deploys guild commands
                    existingCmd = await manager.create(cmd);
                }
            }
            compared.push(existingCmd.id);
        };

        // Remove all commands that no longer exist
        let toRemove = manager.cache.filter((cmd) => !compared.includes(cmd.id));
        toRemove.forEach(async (cmd) => await cmd.delete());
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
            currSlash = {
                name: v.name,
                description: v.desc ?? "",
                type: "CHAT_INPUT",
            };
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
            let type = CommandUtils.getSlashArgType(arg.type);
            // Will change type later
            // TODO: Handle autocomplete and numeric options
            let currArg: Exclude<ApplicationCommandOptionData, | ApplicationCommandSubGroupData | ApplicationCommandSubCommandData | ApplicationCommandNumericOptionData | ApplicationCommandAutocompleteOption> = { // todo fix typing on this
                name: arg.name,
                description: arg.description ?? "",
                type: type,
                required: !arg.optional,
            };

            if (arg.choices && (currArg.type === "STRING" || currArg.type === "INTEGER" || currArg.type === "NUMBER") && !currArg.autocomplete) {
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
