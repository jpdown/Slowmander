import type { Bot } from 'Bot';
import type { CommandContext } from 'CommandContext';
import { Channel, CommandOptionSubOptionResolvableType, MessageEmbed, User, MessageActionRow, MessageButton } from 'discord.js';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import { Module } from './Module';
import { args, command, group, guild, guildOnly, isAdmin, isMod, isOwner, isVIP, subcommand } from './ModuleDecorators';
import { ButtonPaginator } from 'utils/ButtonPaginator';

export class Help extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("help")
    @guild("472222827421106201")
    public async help(c: CommandContext) {
        if (!c.interaction) return;
        let i = c.interaction;
        let commands = c.bot.commandManager.getAllCommands();
        let map = new Map();
        let names: string[] = [];
        let args = c.message?.content.split(' ');;
        for (let cmd of commands) {
            if (await PermissionsHelper.checkPerms(c, cmd)) {
                map.set(cmd.name, cmd.desc);
                names.push(cmd.name);
            }
        }
        const paginator: ButtonPaginator = new ButtonPaginator(names, i, c, 5, "Help", "Slowmander Command Help");
        await paginator.postMessage();
        // if (args?.length === 1) {
        // } else {
        //     await c.reply("lol tyler hasn't implemented this yet");
        // }
    }
}