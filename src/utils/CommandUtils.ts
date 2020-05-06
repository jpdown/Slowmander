import { ColorResolvable, TextChannel, DMChannel, NewsChannel } from "discord.js";

export class CommandUtils {
    static async getSelfColor(channel: TextChannel | DMChannel | NewsChannel): Promise<ColorResolvable> {
        const DEFAULT_COLOR = 0x00a4ff;

        if(channel.type === "text" || channel.type === "news") {
            return(channel.guild.me.displayColor);
        }
        else {
            return(DEFAULT_COLOR);
        }
    }
}