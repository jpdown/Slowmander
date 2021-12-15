import type { Bot } from 'Bot';
import type { CommandContext } from 'CommandContext';
import { Channel, CommandOptionSubOptionResolvableType, MessageEmbed, User, MessageActionRow, MessageButton } from 'discord.js';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import { Module } from './Module';
import { Logger, LogLevel } from 'Logger';
import { args, command, group, guild, guildOnly, isAdmin, isMod, isOwner, isVIP, subcommand } from './ModuleDecorators';
import { ButtonPaginator } from 'utils/ButtonPaginator';

export class Help extends Module { // TODO help with no arguments shows all, help with a specific command argument will also show the description
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
        const paginator: ButtonPaginator = new ButtonPaginator(Object.keys(map), 5, "Help", c.channel, c.bot, this);
        const embed = new MessageEmbed()
            .setTitle("help")
            .setDescription("slowmander command help")
            .setTimestamp()
        let multiplePages = commands.length > 5;
        map.forEach((value: string, key: string) => {
            embed.addField(key, value, false);
        });
        if (c.channel) {
            embed.setColor(await this.bot.utils.getSelfColor(c.channel))
        }
        const row = new MessageActionRow() // TODO these buttons still need to be made active
            .addComponents(
                new MessageButton().setCustomId('prev').setLabel('Previous').setStyle('PRIMARY'),
                new MessageButton().setCustomId('next').setLabel('Next').setStyle('PRIMARY')
            );
        await c.reply({ embeds: [embed], components: [row] }, true);
    }
}