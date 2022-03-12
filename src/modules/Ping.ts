import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import { Module } from "./Module";
import { command, guild } from "./ModuleDecorators";

export class Ping extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("ping")
    public async ping(c: CommandContext) {
        await c.reply(`Pong!\nHeartbeat: ${c.client.ws.ping}ms`, true); // JAVASCRIIIIIIIIIIIIPT
    }
}
