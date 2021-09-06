import Bot from 'Bot';
import { Logger } from 'Logger';

import {
  GuildMember, Message, Collection, Snowflake, TextChannel, MessageEmbed, NewsChannel, GuildBan, PartialGuildMember, PartialMessage, TextBasedChannels,
} from 'discord.js';

export default class EventLogger {
  private bot: Bot;

  private logger: Logger;

  private channelMap: Map<Snowflake, string>;

  constructor(bot: Bot) {
    this.bot = bot;
    this.logger = Logger.getLogger(bot, this);
    this.channelMap = new Map<Snowflake, string>();

    // Register events
    const { client } = this.bot;
    client.on('guildMemberAdd', this.onGuildMemberAdd.bind(this));
    client.on('guildMemberRemove', this.onGuildMemberRemove.bind(this));
    client.on('guildBanAdd', this.onGuildBanAdd.bind(this));
    client.on('guildBanRemove', this.onGuildBanRemove.bind(this));
    client.on('messageDelete', this.onMessageDelete.bind(this));
    client.on('messageDeleteBulk', this.onMessageDeleteBulk.bind(this));
    client.on('messageUpdate', this.onMessageUpdate.bind(this));
  }

  public async onGuildMemberAdd(member: GuildMember) {
    const channel = await this.getLogChannel(member.guild.id);

    if (!channel) {
      return;
    }

    const avatarUrl: string = member.user.displayAvatarURL({ size: 4096, format: 'png', dynamic: true });

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setAuthor('Member Joined', avatarUrl)
      .setThumbnail(avatarUrl)
      .setDescription(`${member.user.toString()} ${member.user.username}#${member.user.discriminator}`)
      .setFooter(`ID: ${member.user.id}`)
      .setTimestamp(member.joinedAt ?? undefined)
      .setColor('GREEN');

    // Send message
    await channel.send({ embeds: [embed] });
  }

  public async onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
    const channel = await this.getLogChannel(member.guild.id);

    if (!channel) {
      return;
    }

    if (member.partial) {
      try {
        member = await member.fetch();
      } catch (err) {
        this.logger.error('Error fetching removed member.', err);
        return;
      }
    }

    const avatarUrl: string = member.user.displayAvatarURL({ size: 4096, format: 'png', dynamic: true });

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setAuthor('Member Left', avatarUrl)
      .setThumbnail(avatarUrl)
      .setDescription(`${member.user.toString()} ${member.user.username}#${member.user.discriminator}`)
      .setFooter(`ID: ${member.user.id}`)
      .setTimestamp(Date.now())
      .setColor('RED');

    // Send message
    await channel.send({ embeds: [embed] });
  }

  public async onGuildBanAdd(ban: GuildBan) {
    const channel = await this.getLogChannel(ban.guild.id);

    if (ban.partial) {
      try {
        ban = await ban.fetch();
      } catch (err) {
        this.logger.error('Error fetching guild ban.', err);
      }
    }

    if (!channel) {
      return;
    }

    const avatarUrl: string = ban.user.displayAvatarURL({ size: 4096, format: 'png', dynamic: true });

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setAuthor('Member Banned', avatarUrl)
      .setThumbnail(avatarUrl)
      .setDescription(`${ban.user.toString()} ${ban.user.username}#${ban.user.discriminator}`)
      .setFooter(`ID: ${ban.user.id}`)
      .setTimestamp(Date.now())
      .setColor('RED');

    if (ban.reason) {
      embed.addField('Reason', ban.reason);
    }

    // Send message
    await channel.send({ embeds: [embed] });
  }

  public async onGuildBanRemove(ban: GuildBan) {
    const channel = await this.getLogChannel(ban.guild.id);

    if (!channel) {
      return;
    }

    const avatarUrl: string = ban.user.displayAvatarURL({ size: 4096, format: 'png', dynamic: true });

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setAuthor('Member Unbanned', avatarUrl)
      .setThumbnail(avatarUrl)
      .setDescription(`${ban.user.toString()} ${ban.user.username}#${ban.user.discriminator}`)
      .setFooter(`ID: ${ban.user.id}`)
      .setTimestamp(Date.now())
      .setColor('GREEN');

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

    const avatarUrl: string = message.author.displayAvatarURL({ size: 4096, format: 'png', dynamic: true });

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setAuthor(`${message.author.username}#${message.author.discriminator}`, avatarUrl)
      .setThumbnail(avatarUrl)
      .setDescription(`**Message sent by ${message.author.toString()} deleted in ${message.channel.toString()}**\n${message.content}`)
      .setFooter(`Author: ${message.author.id} | Message: ${message.id}`)
      .setTimestamp(Date.now())
      .setColor('RED');

    // Send message
    await channel.send({ embeds: [embed] });
  }

  public async onMessageDeleteBulk(messages: Collection<Snowflake, Message | PartialMessage>) {
    const firstMessage: Message | PartialMessage | undefined = messages.first();
    if (!firstMessage || !firstMessage.guild) {
      return;
    }

    const channel = await this.getLogChannel(firstMessage.guild.id);

    if (!channel) {
      return;
    }

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setAuthor(firstMessage.guild.name, firstMessage.guild.iconURL({ size: 4096, format: 'png', dynamic: true }) ?? undefined)
      .setDescription(`**Bulk delete in ${firstMessage.channel.toString()}, ${messages.size} messages deleted**`)
      .setTimestamp(Date.now())
      .setColor('AQUA');

    // Send message
    await channel.send({ embeds: [embed] });
  }

  public async onMessageUpdate(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (newMessage.partial) {
      try {
        newMessage = await newMessage.fetch();
      } catch (err) {
        this.logger.error('Error fetching new message.', err);
        return;
      }
    }
    if (!newMessage.guild) {
      return;
    }

    const channel = await this.getLogChannel(newMessage.guild.id);

    if (!channel || newMessage.author.bot) {
      return;
    }

    if (oldMessage && oldMessage.content === newMessage.content) {
      return;
    }

    const avatarUrl: string = newMessage.author.displayAvatarURL({ size: 4096, format: 'png', dynamic: true });

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setAuthor(`${newMessage.author.username}#${newMessage.author.discriminator}`, avatarUrl)
      .setThumbnail(avatarUrl)
      .setDescription(`**Message edited by ${newMessage.author.toString()} in ${newMessage.channel.toString()}** [Jump](${newMessage.url})`)
      .setFooter(`Author: ${newMessage.author.id} | Message: ${newMessage.id}`)
      .setTimestamp(Date.now())
      .setColor('AQUA');

    if (oldMessage && !oldMessage.partial) {
      embed.addField('Before', oldMessage.content, false);
    }

    embed.addField('After', newMessage.content, false);

    // Send message
    await channel.send({ embeds: [embed] });
  }

  private async getLogChannel(guildId: string): Promise<TextBasedChannels | undefined> {
    let channelId = this.bot.db.eventLogs.getChannel(guildId);

    if (!channelId) {
      return;
    }

    let channel: TextBasedChannels | undefined;

    try {
      if (channelId) {
        channel = <TextBasedChannels> await this.bot.client.channels.fetch(channelId);
      }
    } catch (err) {
      await this.logger.error('Error getting eventlog channel from API', err);
    }

    return channel;
  }
}
