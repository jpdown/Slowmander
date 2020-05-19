import { PantherBot } from "../Bot";
import { GuildMember, Message, Collection, Snowflake, Guild, User, Client, TextChannel, Channel, MessageEmbed } from "discord.js";

export class EventLogger {
    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.bot = bot;

        //Register events
        let client: Client = this.bot.client;
        client.on("guildMemberAdd", this.onGuildMemberAdd.bind(this));
        client.on("guildMemberRemove", this.onGuildMemberRemove.bind(this));
        client.on("guildBanAdd", this.onGuildBanAdd.bind(this));
        client.on("guildBanRemove", this.onGuildBanRemove.bind(this));
        client.on("messageDelete", this.onMessageDelete.bind(this));
        client.on("messageDeleteBulk", this.onMessageDeleteBulk.bind(this));
        client.on("messageUpdate", this.onMessageUpdate.bind(this));
    }

    public async onGuildMemberAdd(member: GuildMember) {
        let channel: TextChannel = await this.getLogChannel();

        if(channel === undefined || member.guild !== channel.guild) {
            return;
        }

        let avatarUrl: string = member.user.displayAvatarURL({size: 4096, format: "png", dynamic: true});

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setAuthor("Member Joined", avatarUrl)
            .setThumbnail(avatarUrl)
            .setDescription(member.user.toString() + " " + member.user.username + "#" + member.user.discriminator)
            .setFooter("ID: " + member.user.id)
            .setTimestamp(member.joinedAt)
            .setColor("GREEN");
        
        //Send message
        await channel.send(embed);
    }

    public async onGuildMemberRemove(member: GuildMember) {
        let channel: TextChannel = await this.getLogChannel();

        if(channel === undefined || member.guild !== channel.guild) {
            return;
        }

        let avatarUrl: string = member.user.displayAvatarURL({size: 4096, format: "png", dynamic: true});

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setAuthor("Member Left", avatarUrl)
            .setThumbnail(avatarUrl)
            .setDescription(member.user.toString() + " " + member.user.username + "#" + member.user.discriminator)
            .setFooter("ID: " + member.user.id)
            .setTimestamp(Date.now())
            .setColor("RED");
        
        //Send message
        await channel.send(embed);
    }

    public async onGuildBanAdd(guild: Guild, user: User) {
        let channel: TextChannel = await this.getLogChannel();

        if(channel === undefined || guild !== channel.guild) {
            return;
        }

        let avatarUrl: string = user.displayAvatarURL({size: 4096, format: "png", dynamic: true});

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setAuthor("Member Banned", avatarUrl)
            .setThumbnail(avatarUrl)
            .setDescription(user.toString() + " " + user.username + "#" + user.discriminator)
            .setFooter("ID: " + user.id)
            .setTimestamp(Date.now())
            .setColor("RED");
        
        //Send message
        await channel.send(embed);
    }

    public async onGuildBanRemove(guild: Guild, user: User) {
        let channel: TextChannel = await this.getLogChannel();

        if(channel === undefined || guild !== channel.guild) {
            return;
        }

        let avatarUrl: string = user.displayAvatarURL({size: 4096, format: "png", dynamic: true});

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setAuthor("Member Unbanned", avatarUrl)
            .setThumbnail(avatarUrl)
            .setDescription(user.toString() + " " + user.username + "#" + user.discriminator)
            .setFooter("ID: " + user.id)
            .setTimestamp(Date.now())
            .setColor("GREEN");
        
        //Send message
        await channel.send(embed);
    }

    public async onMessageDelete(message: Message) {
        let channel: TextChannel = await this.getLogChannel();

        if(channel === undefined || message.guild !== channel.guild || message.author.bot) {
            return;
        }

        let avatarUrl: string = message.author.displayAvatarURL({size: 4096, format: "png", dynamic: true});

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setAuthor(message.author.username + "#" + message.author.discriminator, avatarUrl)
            .setThumbnail(avatarUrl)
            .setDescription(`**Message sent by ${message.author.toString()} deleted in ${message.channel.toString()}**\n${message.content}`)
            .setFooter("Author: " + message.author.id + " | Message: " + message.id)
            .setTimestamp(Date.now())
            .setColor("RED");
        
        //Send message
        await channel.send(embed);
    }

    public async onMessageDeleteBulk(messages: Collection<Snowflake, Message>) {
        let channel: TextChannel = await this.getLogChannel();
        let firstMessage: Message = messages.first();

        if(channel === undefined || firstMessage.guild !== channel.guild) {
            return;
        }


        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setAuthor(firstMessage.guild.name, firstMessage.guild.iconURL({size: 4096, format: "png", dynamic: true}))
            .setDescription(`**Bulk delete in ${firstMessage.channel.toString()}, ${messages.size} messages deleted**`)
            .setTimestamp(Date.now())
            .setColor("AQUA");
        
        //Send message
        await channel.send(embed);
    }

    public async onMessageUpdate(oldMessage: Message, newMessage: Message) {
        let channel: TextChannel = await this.getLogChannel();

        if(channel === undefined || newMessage.guild !== channel.guild || newMessage.author.bot) {
            return;
        }

        if(oldMessage && oldMessage.content === newMessage.content) {
            return;
        }

        let avatarUrl: string = newMessage.author.displayAvatarURL({size: 4096, format: "png", dynamic: true});

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setAuthor(newMessage.author.username + "#" + newMessage.author.discriminator, avatarUrl)
            .setThumbnail(avatarUrl)
            .setDescription(`**Message edited by ${newMessage.author.toString()} in ${newMessage.channel.toString()}** [Jump](${newMessage.url})`)
            .setFooter("Author: " + newMessage.author.id + " | Message: " + newMessage.id)
            .setTimestamp(Date.now())
            .setColor("AQUA");
        
        if(oldMessage) {
            embed.addField("Before", oldMessage.content, false);
        }

        embed.addField("After", newMessage.content, false);
        
        //Send message
        await channel.send(embed);
    }

    private async getLogChannel(): Promise<TextChannel> {
        let channelId: string = this.bot.credentials.eventlogChannelId;
        let channel: Channel = this.bot.client.channels.resolve(channelId);
        if(channel as TextChannel) {
            return(channel as TextChannel);
        }
        else {
            return(undefined);
        }
    }
}