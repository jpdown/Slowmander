import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import { GuildChannel, TextBasedChannel, User } from "discord.js";
import { PermissionsHelper } from "utils/PermissionsHelper";
import { Module } from "./Module";
import { args, command } from "./ModuleDecorators";
import { HelpManager } from "HelpManager";
import { CommandGroup } from "commands/CommandGroup";

export class Help extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("help")
    @args([
        {
            name: "name",
            type: "string",
            description: "specific command",
            optional: true,
            autocomplete: true,
            autocompleteFunc: Help.getAutoComplete
        },
    ])
    public async help(c: CommandContext, name?: string) {
        if (!name) {
            await HelpManager.sendFullHelp(c)
        } else {
            let splitName = name.split(' ');
            let cmd = c.bot.commandManager.getCommand(c.guild?.id, splitName[0]);
            if (!cmd) {
                await c.reply("Command not found.", true);
                return;
            }
            splitName = splitName.slice(1);
            for (let split of splitName) {
                if (!(cmd instanceof CommandGroup)) {
                    await c.reply("Command not found.");
                    return;
                }
                cmd = cmd.getSubCommand(split);
                if (!cmd) {
                    await c.reply("Command not found.");
                    return;
                }
            }

            await HelpManager.sendCommandHelp(cmd, c);
        }
    }

    private static async getAutoComplete(channel: TextBasedChannel, user: User, id: string | null, bot: Bot): Promise<string[]> {
        let ret: string[] = [];
        let commands = bot.commandManager.getAllCommands();
        let member;
        if (id) {
            member = (<GuildChannel>channel).guild.members.resolve(user);
        }
        if (!member) {
            for (let cmd of commands) {
                if (await PermissionsHelper.checkPerms(cmd, user, bot) && !cmd.guildOnly) { 
                    ret.push(cmd.name);
                }
            }
        }
        else {
            for (let cmd of commands) {
                if (await PermissionsHelper.checkPerms(cmd, member, bot, channel as GuildChannel)) { 
                    ret.push(cmd.name);
                }
            }
        }
        return ret;
    }
}
