import { Bot } from "Bot";
import { Module } from "./Module";
import { args, command, group, guildOnly, isMod, subcommand } from "./ModuleDecorators";
import { CommandContext } from "CommandContext";
import { Channel, Emoji, EmojiResolvable, GuildChannel } from "discord.js";

export class Starboard extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("Starboard config")
    @isMod()
    @guildOnly()
    @args([
        {
            name: "emote",
            type: "emoji",
            description: "Emote for pinning messages",
        },
        {
            name: "channel",
            type: "channel",
            description: "Channel for pinning messages",
        },
        {
            name: "number",
            type: "int",
            description: "Number of reactions required to pin",
        },
        {
            name: "enabled",
            type: "bool",
            description: "Whether starboard is enabled for this server",
        }
    ])
    public async starboard(ctx: CommandContext, emote: EmojiResolvable, channel: Channel, number: number, enabled: boolean) {

    }

    @subcommand("status", "Returns the configuration")
    @isMod()
    @guildOnly()
    public async status(c: CommandContext<true>) {

    }
}
