import type { Bot } from 'Bot';
import type { CommandContext } from 'CommandContext';
import { Channel, CommandOptionSubOptionResolvableType, MessageEmbed, User, MessageActionRow, MessageButton } from 'discord.js';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import { Module } from './Module';
import { Logger, LogLevel } from 'Logger';
import { args, command, group, guild, guildOnly, isAdmin, isMod, isOwner, isVIP, subcommand } from './ModuleDecorators';

export class Help extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("help")
    @guild("472222827421106201")
    public async help(c: CommandContext) {
        let commands = c.bot.commandManager.getAllCommands();
        let map = new Map();
        for (let cmd of commands) {
            if (await PermissionsHelper.checkPerms(c, cmd)) {
                map.set(cmd.name, cmd.desc);
            }
        }
        const embed = new MessageEmbed()
        .setTitle("help")
        .setDescription("slowmander command help")
        .setTimestamp()
        let multiplePages = commands.length > 5;
        let i = 0;
        map.forEach((value: string, key: string) => {
            if (i < 5){
                embed.addField(key, value, false);
            }
            i++;
        });
        const row = new MessageActionRow() // TODO these buttons still need to be made active
        .addComponents(
            new MessageButton().setCustomId('prev').setLabel('Previous').setStyle('PRIMARY'),
            new MessageButton().setCustomId('next').setLabel('Next').setStyle('PRIMARY')
        );
        await c.reply({embeds: [embed], components: [row]}, true);
    }
}