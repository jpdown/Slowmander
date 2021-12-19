import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import { MessageEmbed, TextBasedChannels } from "discord.js";
import { PermissionsHelper } from "utils/PermissionsHelper";
import { Module } from "./Module";
import { args, command, guild } from "./ModuleDecorators";
import { ButtonPaginator } from "utils/ButtonPaginator";

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
        },
    ])
    public async help(c: CommandContext) {
        let commands = c.bot.commandManager.getAllCommands();
        let map = new Map();
        let args = c.args;
        await c.defer();
        for (let cmd of commands) {
            if (await PermissionsHelper.checkPerms(c, cmd)) {
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
            if (!cmdName) return; // is this the best way to handle something possibly being undefined?
            if (!map.get(cmdName)) {
                await c.reply("Command not found!");
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

    private async generateEmbed(
        title: string,
        desc: string,
        channel: TextBasedChannels
    ): Promise<MessageEmbed> {
        const embed: MessageEmbed = new MessageEmbed()
            .setColor(await this.bot.utils.getSelfColor(channel))
            .setDescription(desc)
            .setTitle(title)
            .setTimestamp();
        return embed;
    }
}
