import { PantherBot } from "../Bot";
import { GuildMember, Message, Collection, Snowflake, Guild, User, Client, TextChannel, MessageEmbed, NewsChannel } from "discord.js";
import { Logger } from "../Logger";

export class EventLogger {
    private bot: PantherBot;
    private logger: Logger;
    private channelMap: Map<Snowflake, string>;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
        this.channelMap = new Map<Snowflake, string>();

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
        let channel: TextChannel | NewsChannel = await this.getLogChannel(member.guild.id);

        if(!channel) {
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
        let channel: TextChannel | NewsChannel = await this.getLogChannel(member.guild.id);

        if(!channel) {
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
        let channel: TextChannel | NewsChannel = await this.getLogChannel(guild.id);

        if(!channel) {
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
        let channel: TextChannel | NewsChannel = await this.getLogChannel(guild.id);

        if(!channel) {
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
        if(message.partial || !message.guild || message.author.bot) {
            return;
        }

        let channel: TextChannel | NewsChannel = await this.getLogChannel(message.guild.id);

        if(!channel) {
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
        let firstMessage: Message = messages.first();
        if(!firstMessage.guild) {
            return;
        }

        let channel: TextChannel | NewsChannel = await this.getLogChannel(firstMessage.guild.id);

        if(!channel) {
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
        if(!newMessage.guild) {
            return;
        }

        let channel: TextChannel | NewsChannel = await this.getLogChannel(newMessage.guild.id);

        if(!channel || newMessage.author.bot) {
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

    public async setEventlogChannel(guildId: string, channelId: string) {
        let result: boolean = await this.bot.configs.guildConfig.setEventlogChannel(guildId, channelId);
        if(result) this.channelMap.set(guildId, channelId);

        return(result)
    }

    private async getLogChannel(guildId: string): Promise<TextChannel | NewsChannel> {
        let channelId: Snowflake;

        if(this.channelMap.has(guildId)) {
            channelId = this.channelMap.get(guildId);
        }
        else {
            try {
                channelId = await this.bot.configs.guildConfig.getEventlogChannel(guildId);
                if(channelId) {
                    this.channelMap.set(guildId, channelId);
                }
            }
            catch(err) {
                await this.logger.error("Error getting eventlog channel", err);
            }
        }

        let channel: TextChannel | NewsChannel;

        try {
            if(channelId) {
                channel = <TextChannel | NewsChannel> await this.bot.client.channels.fetch(channelId);
            }
        }
        catch(err) {
            await this.logger.error("Error getting eventlog channel from API", err);
        }

        return(channel);
    }
}