import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { Command } from "commands/Command";
import type { Channel, User } from "discord.js";
import { Module } from "./Module";
import {
    args,
    command,
    group,
    guild,
    guildOnly,
    isAdmin,
    isMod,
    isOwner,
    isVIP,
    subcommand,
    subgroup,
} from "./ModuleDecorators";

export class Fun extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("cats")
    @guild("472222827421106201")
    public async cat(ctx: CommandContext) {
        await ctx.reply("cat");
    }

    @command("dogs")
    @guild("472222827421106201")
    public async dog(ctx: CommandContext) {
        await ctx.reply("dog");
    }

    @group("dad jokes")
    @guild("472222827421106201")
    public async dadjoke(ctx: CommandContext) {
        await ctx.reply("dadjoke");
    }

    @subcommand("dadjoke", "sub of dadjokes")
    @guild("472222827421106201")
    public async sub(ctx: CommandContext) {
        await ctx.reply("dadjoke sub");
    }

    @subgroup("dadjoke", "another sub of dadjokes")
    @guild("472222827421106201")
    @guildOnly()
    public async testargs2(ctx: CommandContext) {
        await ctx.reply(`hi`);
    }

    @subcommand("dadjoke,testargs2", "another sub of testartgs2")
    @guild("472222827421106201")
    @args([
        { name: "user", type: "user", description: "the user" },
        { name: "channel", type: "channel", description: "the channel" },
    ])
    @guildOnly()
    public async testargs(ctx: CommandContext, user: User, channel: Channel) {
        await ctx.reply(`User ID: ${user.id}, Channel ID: ${channel.id}`);
    }

    @command("owner test")
    @guild("472222827421106201")
    @isOwner()
    public async testowner(ctx: CommandContext) {
        await ctx.reply("you passed the test");
    }

    @command("admin test")
    @guild("472222827421106201")
    @isAdmin()
    public async testadmin(ctx: CommandContext) {
        await ctx.reply("you passed the test");
    }

    @command("mod test")
    @guild("472222827421106201")
    @isMod()
    public async testmod(ctx: CommandContext) {
        await ctx.reply("you passed the test");
    }

    @command("vip test")
    @guild("472222827421106201")
    @isVIP()
    public async testvip(ctx: CommandContext) {
        await ctx.reply("you passed the test");
    }

    @command("slash deploying")
    @isOwner()
    @guild("472222827421106201")
    public async deployslash(ctx: CommandContext) {
        try {
            await this.bot.commandManager.deploySlashCommands();
            await ctx.reply("slash commands theoretically deployed");
        } catch (err) {
            console.log(err);
        }
    }

    @group("parent")
    @guild("472222827421106201")
    public async group(ctx: CommandContext) {
        await ctx.reply("parent");
    }

    @subgroup("group", "subgroup")
    @guild("472222827421106201")
    public async subgroup(ctx: CommandContext) {
        await ctx.reply("subgroup");
    }

    @subcommand("group,subgroup", "subcommand1")
    @guild("472222827421106201")
    public async subcommand(ctx: CommandContext) {
        await ctx.reply("subcommand1");
    }
}
