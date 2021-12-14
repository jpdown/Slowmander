import type { Bot } from 'Bot';
import type { CommandContext } from 'CommandContext';
import type { Channel, User } from 'discord.js';
import { Module } from './Module';
import { args, command, group, guild, guildOnly, isAdmin, isMod, isOwner, isVIP, subcommand } from './ModuleDecorators';

export class Ping extends Module {
  public constructor(bot: Bot) {
    super(bot);
  }

  @command("ping")
  @guild("472222827421106201")
  public async ping(c: CommandContext) {
      await c.reply(`Last heartbeat: ${c.client.ws.ping}`, true); // JAVASCRIIIIIIIIIIIIPT
  }
}