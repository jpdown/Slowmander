import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import { Channel, GuildChannel, MessageEmbed, TextBasedChannel, User } from "discord.js";
import { PermissionsHelper } from "utils/PermissionsHelper";
import { Module } from "./Module";
import { args, command, guild } from "./ModuleDecorators";
import { ButtonPaginator } from "utils/ButtonPaginator";
import { CommandUtils } from "utils/CommandUtils";

export class Help extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("help")
    @guild("472222827421106201")
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
    public async help(c: CommandContext) {
        let commands = c.bot.commandManager.getAllCommands();
        let map = new Map();
        let args = c.args;
        await c.defer();
        for (let cmd of commands) {
            if (await PermissionsHelper.checkPerms(cmd, c)) {
                map.set(cmd.name, cmd.desc);
            }
        }
        if (!args || args.length === 0) {
            const paginator: ButtonPaginator = new ButtonPaginator(
                Array.from(map.keys()),
                c,
                5,
                "Help"
            );
            await paginator.postMessage();
        } else {
            let cmdName = args[0]?.toString();
            if (!cmdName || !map.get(cmdName)) {
                await c.reply("Command not found!");
                return;
            }
            await c.reply({
                embeds: [
                    await this.generateEmbed(
                        cmdName,
                        map.get(cmdName),
                        c.channel
                    ),
                ],
            });
        }
    }

    private static async getAutoComplete(channel: TextBasedChannel, user: User, id: string | null, bot: Bot): Promise<string[]> {
        if (id) {
            let ret: string[] = [];
            let commands = bot.commandManager.getAllCommands();
            for (let cmd of commands) {
                if (await PermissionsHelper.checkPerms(cmd, user, bot, channel as GuildChannel)) { 
                    ret.push(cmd.name);
                }
            }
            return ret;
        }
        return [];
    }

    private async generateEmbed(
        title: string,
        desc: string,
        channel: TextBasedChannel
    ): Promise<MessageEmbed> {
        const embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(channel))
            .setDescription(desc)
            .setTitle(title)
            .setTimestamp();
        return embed;
    }
}
