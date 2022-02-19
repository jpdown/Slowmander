import type { Bot } from "Bot";
import { Logger } from "Logger";

import {
    GuildMember,
    Message,
    Collection,
    Snowflake,
    GuildBan,
    PartialGuildMember,
    PartialMessage,
    TextBasedChannel,
    MessageEmbed,
} from "discord.js";

export class EventLogger {
    private bot: Bot;

    private logger: Logger;

    private channelMap: Map<Snowflake, string>;

    constructor(bot: Bot) {
        this.bot = bot;
        this.logger = Logger.getLogger(this);
        this.channelMap = new Map<Snowflake, string>();

        // Register events
        const { client } = this.bot;
        client.on("guildMemberAdd", this.onGuildMemberAdd.bind(this));
        client.on("guildMemberRemove", this.onGuildMemberRemove.bind(this));
        client.on("guildBanAdd", this.onGuildBanAdd.bind(this));
        client.on("guildBanRemove", this.onGuildBanRemove.bind(this));
        client.on("messageDelete", this.onMessageDelete.bind(this));
        client.on("messageDeleteBulk", this.onMessageDeleteBulk.bind(this));
        client.on("messageUpdate", this.onMessageUpdate.bind(this));
    }

    public async onGuildMemberAdd(member: GuildMember) {
        const channel = await this.getLogChannel(member.guild.id);

        if (!channel) {
            return;
        }

        const avatarUrl: string = member.user.displayAvatarURL({
            size: 4096,
            format: "png",
            dynamic: true,
        });

        // Build embed
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor({name: "Member Joined", iconURL: avatarUrl})
            .setThumbnail(avatarUrl)
            .setDescription(
                `${member.user.toString()} ${member.user.username}#${
                    member.user.discriminator
                }`
            )
            .setFooter({ text: `ID: ${member.user.id}` })
            .setTimestamp(member.joinedAt ?? undefined)
            .setColor("GREEN");

        // Send message
        await channel.send({ embeds: [embed] });
    }

    public async onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
        let fullMember: GuildMember;
        try {
            if (member.partial) {
                fullMember = await member.fetch();
            } else {
                fullMember = member;
            }
        } catch (err) {
            this.logger.error("Error fetching removed member.", err);
            return;
        }

        const channel = await this.getLogChannel(fullMember.guild.id);

        if (!channel) {
            return;
        }

        const avatarUrl: string = fullMember.user.displayAvatarURL({
            size: 4096,
            format: "png",
            dynamic: true,
        });

        // Build embed
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor({name: "Member Left", iconURL: avatarUrl})
            .setThumbnail(avatarUrl)
            .setDescription(
                `${fullMember.user.toString()} ${fullMember.user.username}#${
                    fullMember.user.discriminator
                }`
            )
            .setFooter({ text: `ID: ${fullMember.user.id}` })
            .setTimestamp(Date.now())
            .setColor("RED");

        // Send message
        await channel.send({ embeds: [embed] });
    }

    public async onGuildBanAdd(ban: GuildBan) {
        let fullBan: GuildBan;
        try {
            if (ban.partial) {
                fullBan = await ban.fetch();
            } else {
                fullBan = ban;
            }
        } catch (err) {
            this.logger.error("Error fetching guild ban.", err);
            return;
        }

        const channel = await this.getLogChannel(fullBan.guild.id);

        if (!channel) {
            return;
        }

        const avatarUrl: string = fullBan.user.displayAvatarURL({
            size: 4096,
            format: "png",
            dynamic: true,
        });

        // Build embed
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor({name: "Member Banned", iconURL: avatarUrl})
            .setThumbnail(avatarUrl)
            .setDescription(
                `${fullBan.user.toString()} ${fullBan.user.username}#${
                    fullBan.user.discriminator
                }`
            )
            .setFooter({ text: `ID: ${fullBan.user.id}` })
            .setTimestamp(Date.now())
            .setColor("RED");

        if (fullBan.reason) {
            embed.addField("Reason", fullBan.reason);
        }

        // Send message
        await channel.send({ embeds: [embed] });
    }

    public async onGuildBanRemove(ban: GuildBan) {
        const channel = await this.getLogChannel(ban.guild.id);

        if (!channel) {
            return;
        }

        const avatarUrl: string = ban.user.displayAvatarURL({
            size: 4096,
            format: "png",
            dynamic: true,
        });

        // Build embed
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor({name: "Member Unbanned", iconURL: avatarUrl})
            .setThumbnail(avatarUrl)
            .setDescription(
                `${ban.user.toString()} ${ban.user.username}#${
                    ban.user.discriminator
                }`
            )
            .setFooter({ text: `ID: ${ban.user.id}` })
            .setTimestamp(Date.now())
            .setColor("GREEN");

        // Send message
        await channel.send({ embeds: [embed] });
    }

    public async onMessageDelete(message: Message | PartialMessage) {
        if (message.partial || !message.guild || message.author.bot) {
            return;
        }

        const channel = await this.getLogChannel(message.guild.id);

        if (!channel) {
            return;
        }

        const avatarUrl: string = message.author.displayAvatarURL({
            size: 4096,
            format: "png",
            dynamic: true,
        });

        // Build embed
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor({
                name: `${message.author.username}#${message.author.discriminator}`,
                iconURL: avatarUrl
            })
            .setThumbnail(avatarUrl)
            .setDescription(
                `**Message sent by ${message.author.toString()} deleted in ${message.channel.toString()}**\n${
                    message.content
                }`
            )
            .setFooter({ text: `Author: ${message.author.id} | Message: ${message.id}` })
            .setTimestamp(Date.now())
            .setColor("RED");

        // Send message
        await channel.send({ embeds: [embed] });
    }

    public async onMessageDeleteBulk(
        messages: Collection<Snowflake, Message | PartialMessage>
    ) {
        const firstMessage: Message | PartialMessage | undefined =
            messages.first();
        if (!firstMessage || !firstMessage.guild) {
            return;
        }

        const channel = await this.getLogChannel(firstMessage.guild.id);

        if (!channel) {
            return;
        }

        // Build embed
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor({
                name: firstMessage.guild.name,
                iconURL: firstMessage.guild.iconURL({
                    size: 4096,
                    format: "png",
                    dynamic: true,
                }) ?? undefined
            })
            .setDescription(
                `**Bulk delete in ${firstMessage.channel.toString()}, ${
                    messages.size
                } messages deleted**`
            )
            .setTimestamp(Date.now())
            .setColor("AQUA");

        // Send message
        await channel.send({ embeds: [embed] });
    }

    public async onMessageUpdate(
        oldMessage: Message | PartialMessage,
        newMessage: Message | PartialMessage
    ) {
        let fullMessage: Message;

        if (newMessage.partial) {
            try {
                fullMessage = await newMessage.fetch();
            } catch (err) {
                this.logger.error("Error fetching new message.", err);
                return;
            }
        } else {
            fullMessage = newMessage;
        }

        if (!fullMessage.guild) {
            return;
        }

        const channel = await this.getLogChannel(fullMessage.guild.id);

        if (!channel || fullMessage.author.bot) {
            return;
        }

        if (oldMessage && oldMessage.content === fullMessage.content) {
            return;
        }

        const avatarUrl: string = fullMessage.author.displayAvatarURL({
            size: 4096,
            format: "png",
            dynamic: true,
        });

        // Build embed
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor({
                name: `${fullMessage.author.username}#${fullMessage.author.discriminator}`,
                iconURL: avatarUrl
            })
            .setThumbnail(avatarUrl)
            .setDescription(
                `**Message edited by ${fullMessage.author.toString()} in ${fullMessage.channel.toString()}** [Jump](${
                    fullMessage.url
                })`
            )
            .setFooter({
                text: `Author: ${fullMessage.author.id} | Message: ${fullMessage.id}`
            })
            .setTimestamp(Date.now())
            .setColor("AQUA");

        if (oldMessage && !oldMessage.partial) {
            embed.addField("Before", oldMessage.content, false);
        }

        embed.addField("After", fullMessage.content, false);

        // Send message
        await channel.send({ embeds: [embed] });
    }

    private async getLogChannel(
        guildId: string
    ): Promise<TextBasedChannel | undefined> {
        const channelId = this.bot.db.eventLogs.getChannel(guildId);

        if (!channelId) {
            return undefined;
        }

        let channel: TextBasedChannel | undefined;

        try {
            if (channelId) {
                channel = <TextBasedChannel>(
                    await this.bot.client.channels.fetch(channelId)
                );
            }
        } catch (err) {
            await this.logger.error(
                "Error getting eventlog channel from API",
                err
            );
        }

        return channel;
    }
}
