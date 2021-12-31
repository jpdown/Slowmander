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

export class Test extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("guild only test command")
    @guild("472222827421106201")
    public async guildonly(ctx: CommandContext) {
        await ctx.reply("this do be in the guild");
    }

    @command("global test command")
    public async globalcmd(ctx: CommandContext) {
        await ctx.reply("this do be global");
    }
}
