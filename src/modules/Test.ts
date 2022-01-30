import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { Command, CommandArgs } from "commands/Command";
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

    @command("testing choices")
    @guild("472222827421106201")
    @args([
        { name:"arg", type: "string", description: "ye", choices: [
            {name: "this is name 1", value: "value1"},
            {name: "This is name 2", value:"value2"}
        ]}
    ])
    public async choicestest(ctx: CommandContext, arg: string) {
        await ctx.reply(arg);
    }

    @command("testing emoji parsing")
    @guild("472222827421106201")
    @args([
        { name: "yeah", type: "emoji", "description": "yup" }
    ])
    public async testemoji(c: CommandContext, yeah: CommandArgs["emoji"]) {
        if (typeof yeah === "string") {
            await c.reply(yeah + " is an emoji");
        }
        else {
            await c.reply(yeah.toString() + " is an emote");
        }
    }
}
