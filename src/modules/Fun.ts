import type { CommandContext } from 'CommandContext';
import { Module, command, group, subcommand } from './Module';

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

  @group()
  public async testGroup(ctx: CommandContext) {
    await ctx.reply('in group');
  }

  @subcommand(Fun.prototype.testGroup)
  public async testchild1(ctx: CommandContext) {
    await ctx.reply('in testchild1');
  }

  @subcommand(Fun.prototype.testGroup)
  public async testchild2(ctx: CommandContext) {
    await ctx.reply('in testchild2');
  }
}
