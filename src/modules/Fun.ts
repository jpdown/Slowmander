import type { CommandContext } from 'CommandContext';
import type { Channel, User } from 'discord.js';
import { Module } from './Module';
import { args, command, group, subcommand } from './ModuleDecorators';

export class Fun extends Module {
  public constructor() {
    super();
  }

  @command()
  public async cat(ctx: CommandContext) {
    await ctx.reply('cat');
  }

  @command()
  public async dog(ctx: CommandContext) {
    await ctx.reply('dog');
  }

  @command()
  public async dadjoke(ctx: CommandContext) {
    await ctx.reply('dadjoke');
  }

  @command()
  @args([
    { name: 'user', type: 'user' },
    { name: 'channel', type: 'channel' },
  ])
  public async testArgs(ctx: CommandContext, user: User, channel: Channel) {
    await ctx.reply(`User ID: ${user.id}, Channel ID: ${channel.id}`);
  }
}
