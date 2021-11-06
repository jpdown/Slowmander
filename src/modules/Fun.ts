import type { CommandContext } from 'CommandContext';
import type { Channel, User } from 'discord.js';
import { Module } from './Module';
import { args, command, group, guild, guildOnly, isAdmin, isMod, isOwner, isVIP, subcommand } from './ModuleDecorators';

export class Fun extends Module {
  public constructor() {
    super();
  }

  @command()
  @guild("472222827421106201")
  public async cat(ctx: CommandContext) {
    await ctx.reply('cat');
  }

  @command()
  public async dog(ctx: CommandContext) {
    await ctx.reply('dog');
  }

  @group()
  public async dadjoke(ctx: CommandContext) {
    await ctx.reply('dadjoke');
  }

  @subcommand('dadjoke')
  public async sub(ctx: CommandContext) {
    await ctx.reply('dadjoke sub');
  }

  @subcommand('dadjoke')
  @args([
    { name: 'user', type: 'user' },
    { name: 'channel', type: 'channel' },
  ])
  @guildOnly()
  public async testArgs(ctx: CommandContext, user: User, channel: Channel) {
    await ctx.reply(`User ID: ${user.id}, Channel ID: ${channel.id}`);
  }

  @command()
  @isOwner()
  public async testOwner(ctx: CommandContext) {
    await ctx.reply('you passed the test');
  }

  @command()
  @isAdmin()
  public async testAdmin(ctx: CommandContext) {
    await ctx.reply('you passed the test');
  }

  @command()
  @isMod()
  public async testMod(ctx: CommandContext) {
    await ctx.reply('you passed the test');
  }

  @command()
  @isVIP()
  public async testVIP(ctx: CommandContext) {
    await ctx.reply('you passed the test');
  }
}
