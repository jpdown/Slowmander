import {Command, PermissionLevel, CommandResult} from 'commands/Command';
import { Bot } from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';

import {Message, MessageEmbed, TextChannel} from 'discord.js';

export class WelcomeMessages extends Command {
    private readonly CHANNEL_ID: string = "329371265372782593";
    private readonly MESSAGE_ONE_ID: string = "702747244079874048";
    private readonly MESSAGE_TWO_ID: string = "702747244733923338";
    private readonly MESSAGE_THREE_ID: string = "702747245446955108";

    constructor(bot: Bot) {
        super("welcome", PermissionLevel.Owner, "Edits welcome messages", bot);
    }

    async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
        let channel: TextChannel = <TextChannel> message.client.channels.resolve(this.CHANNEL_ID);
        let messageOne: Message = await channel.messages.fetch(this.MESSAGE_ONE_ID);
        let messageTwo: Message = await channel.messages.fetch(this.MESSAGE_TWO_ID);
        let messageThree: Message = await channel.messages.fetch(this.MESSAGE_THREE_ID);

        //Build first embed
        let embed: MessageEmbed = new MessageEmbed()
            .setTitle("**Welcome to the Panther Squad!**")
            .setDescription("My social media links are as follows:")
            .addField("Twitch", "https://www.twitch.tv/jpdown", false)
            .addField("YouTube", "https://www.youtube.com/jpdown", false)
            .addField("Twitter", "https://www.twitter.com/jpdown", false)
            .addField("Invite Link", "https://discord.gg/Y9NhGZD", false)
            .setThumbnail(channel.guild.iconURL({size: 4096, format: "png", dynamic: true})!)
            .setColor(await CommandUtils.getSelfColor(channel, bot));
        
        await messageOne.edit({embeds: [embed]});

        //Build second embed
        embed = new MessageEmbed()
            .setTitle("**Our Rules**")
            .setDescription("1. Be respectful, let's keep this Discord a positive place to hang out\n" + 
                "2. No hate speech or harassment, we're all nice people\n" + 
                "3. No ban evasion\n" + 
                "4. Keep drama in private please\n"
                + "\n"
                + "Basically, use your brain. This Discord is meant to be a welcoming and positive place so let's keep it that way!")
            .setColor(await CommandUtils.getSelfColor(channel, bot));
        
        await messageTwo.edit({embeds: [embed]});

        //Build third embed
        embed = new MessageEmbed()
            .setTitle("**Announcement Roles**")
            .setDescription("React on this message for roles that I can ping you with!")
            .addField("<:DiscordPings:702734300898131998>", "General Discord announcements", true)
            .addField("<:TwitchPings:702734175815335967>", "Pings for my Twitch streams", true)
            .addField("<:YouTubePings:702734117879545916>", "Pings for my YouTube videos", true)
            .setColor(await CommandUtils.getSelfColor(channel, bot));
        
        await messageThree.edit({embeds: [embed]});

        return {sendHelp: false, command: this, message: message};
    }
}