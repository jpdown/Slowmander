import { Guild, MessageEmbed, Snowflake, TextChannel, NewsChannel, Permissions } from "discord.js";
import { PantherBot } from "../Bot";

export class ModErrorLog {
    public static async log(message: string, guild: Guild, bot: PantherBot): Promise<boolean> {
        //Find mod error log channel
        let channelId: Snowflake = await bot.configs.guildConfig.getModErrorChannel(guild.id);
        if(!channelId) {
            return(false);
        }

        let channel: TextChannel | NewsChannel = <TextChannel | NewsChannel> guild.channels.resolve(channelId);
        if(!channel) {
            return(false);
        }

        //Make sure we have perms
        if(!channel.permissionsFor(guild.client.user).has(Permissions.FLAGS.SEND_MESSAGES)) {
            return(false);
        }
        
        let embed: MessageEmbed = new MessageEmbed()
            .setColor("#FF0000")
            .setDescription("❌ " + message)
            .setTimestamp(Date.now());
        
        
        await channel.send(embed);
        return(true);
    }
}