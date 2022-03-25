import { CommandContext } from "CommandContext";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command } from "./ModuleDecorators";

export class MessageMe extends Module {
    @command("Messages you the given argument")
    @args([{ name: "message", type: "string", description: "The message to send" }])
    public async dmme(c: CommandContext, message: string) {
        let embed = await CommandUtils.generateEmbed(message);

        await c.interaction?.user
            .send({ embeds: [embed] })
            .then(async () => await c.reply("Sent!", true))
            .catch(async () => await c.reply("I can't DM you!", true));
    }
}
