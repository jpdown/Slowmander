import type { Bot } from 'Bot';
import type { CommandContext } from 'CommandContext';
import type { Channel, User } from 'discord.js';
import { Module } from './Module';
import { args, command, group, guild, guildOnly, isAdmin, isMod, isOwner, isVIP, subcommand } from './ModuleDecorators';

export class Help extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("help")
    @guild("472222827421106201")
    public async help(c: CommandContext) {
        const commands = c.bot.commandManager.getAllCommands();
        let helpMsg = '';
        commands.forEach(async (cmd) => {
            // todo check for permissions to show commands that the person running help can use 
            helpMsg += `\`${cmd.name}\` - ${cmd.desc}\n`;
        });
        await c.channel?.send(helpMsg);
    }
}