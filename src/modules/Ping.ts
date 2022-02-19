import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
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
} from "./ModuleDecorators";

export class Ping extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("ping")
    public async ping(c: CommandContext) {
        await c.reply(`Pong!\nHeartbeat: ${c.client.ws.ping}ms`, true); // JAVASCRIIIIIIIIIIIIPT
    }
}
