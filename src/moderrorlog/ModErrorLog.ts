import type { Bot } from "Bot";

import {
    Guild,
    MessageEmbed,
    TextChannel,
    NewsChannel,
    Permissions,
} from "discord.js";

export class ModErrorLog {
    public static async log(
        message: string,
        guild: Guild,
        bot: Bot
    ): Promise<boolean> {
        // Find mod error log channel
        const channelId = bot.db.guildConfigs.getModChannel(guild.id);
        if (!channelId) {
            return false;
        }

        const channel: TextChannel | NewsChannel = <TextChannel | NewsChannel>(
            guild.channels.resolve(channelId)
        );
        if (!channel) {
            return false;
        }

        // Make sure we have perms
        if (
            !guild.me ||
            !channel
                .permissionsFor(guild.me)
                .has(Permissions.FLAGS.SEND_MESSAGES)
        ) {
            return false;
        }

        const embed: MessageEmbed = new MessageEmbed()
            .setColor("#FF0000")
            .setDescription(`❌ ${message}`)
            .setTimestamp(Date.now());

        await channel.send({ embeds: [embed] });
        return true;
    }
}
