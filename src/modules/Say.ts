import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { TextBasedChannel } from "discord.js";
import { Logger } from "Logger";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, guild, isOwner } from "./ModuleDecorators";

export class Say extends Module {
    public constructor(b: Bot) {
        super(b);
    }

    @command("Send a message as the bot.")
    @isOwner()
    @guild("472222827421106201")
    @args([
        {
            name: "message",
            type: "string",
            description: "The message to send",
        },
        {
            name: "channel",
            type: "channel",
            description: "The channel(s) to send to",
            optional: true,
        },
    ])
    public async say(c: CommandContext, m: string, chan?: TextBasedChannel) {
        let util = new CommandUtils(c.bot);
        let channel;
        if (!chan) {
            channel = c.channel;
        } else {
            channel = chan;
        }
        await util.sendMessage(m, channel);
        await c.reply("Sent!", true);
    }
}
