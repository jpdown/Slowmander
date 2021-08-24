import { PantherBot } from "Bot";

import { Guild, MessageEmbed, Snowflake, TextChannel, NewsChannel, Permissions } from "discord.js";

export class ModErrorLog {
    public static async log(message: string, guild: Guild, bot: PantherBot): Promise<boolean> {
        //Find mod error log channel
        let channelId: Snowflake | undefined = await bot.configs.guildConfig.getModErrorChannel(guild.id);
        if(!channelId) {
            return(false);
        }

        let channel: TextChannel | NewsChannel = <TextChannel | NewsChannel> guild.channels.resolve(channelId);
        if(!channel) {
            return(false);
        }

        //Make sure we have perms
        if(!guild.me || !channel.permissionsFor(guild.me).has(Permissions.FLAGS.SEND_MESSAGES)) {
            return(false);
        }
        
        let embed: MessageEmbed = new MessageEmbed()
            .setColor("#FF0000")
            .setDescription("❌ " + message)
            .setTimestamp(Date.now());
        
        
        await channel.send({embeds: [embed]});
        return(true);
    }
}