import type { Bot } from 'Bot';
import type { CommandContext } from 'CommandContext';
import type { Channel, User } from 'discord.js';
import { Module } from './Module';
import { args, command, group, guild, guildOnly, isAdmin, isMod, isOwner, isVIP, subcommand } from './ModuleDecorators';

export class Fun extends Module {
  public constructor(bot: Bot) {
    super(bot);
  }

  @command("cats")
  @guild("472222827421106201")
  public async cat(ctx: CommandContext) {
    await ctx.reply('cat');
  }

  @command("dogs")
  @guild("472222827421106201")
  public async dog(ctx: CommandContext) {
    await ctx.reply('dog');
  }

  @group("dad jokes")
  @guild("472222827421106201")
  public async dadjoke(ctx: CommandContext) {
    await ctx.reply('dadjoke');
  }

  @subcommand('dadjoke', "sub of dadjokes")
  @guild("472222827421106201")
  public async sub(ctx: CommandContext) {
    await ctx.reply('dadjoke sub');
  }

  @subcommand('dadjoke', "another sub of dadjokes")
  @guild("472222827421106201")
  @args([
    { name: 'user', type: 'user' },
    { name: 'channel', type: 'channel' },
  ])
  @guildOnly()
  public async testargs(ctx: CommandContext, user: User, channel: Channel) {
    await ctx.reply(`User ID: ${user.id}, Channel ID: ${channel.id}`);
  }

  @command("owner test")
  @guild("472222827421106201")
  @isOwner()
  public async testowner(ctx: CommandContext) {
    await ctx.reply('you passed the test');
  }

  @command("admin test")
  @guild("472222827421106201")
  @isAdmin()
  public async testadmin(ctx: CommandContext) {
    await ctx.reply('you passed the test');
  }

  @command("mod test")
  @guild("472222827421106201")
  @isMod()
  public async testmod(ctx: CommandContext) {
    await ctx.reply('you passed the test');
  }

  @command("vip test")
  @guild("472222827421106201")
  @isVIP()
  public async testvip(ctx: CommandContext) {
    await ctx.reply('you passed the test');
  }

  @command("slash deploying")
  @isOwner()
  @guild("472222827421106201")
  public async deployslash(ctx: CommandContext) {
    try {
      await this.bot.commandManager.deploySlashCommands()
      await ctx.reply('slash commands theoretically deployed');
    }
    catch(err) {
      console.log(err);
    }
  }
}
