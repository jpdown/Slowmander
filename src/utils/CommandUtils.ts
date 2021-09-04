import Bot from 'Bot';

import {
  ColorResolvable, User, Client, Collection, Snowflake, Guild, GuildMember, Role, Channel, GuildEmoji, WebhookClient, SnowflakeUtil, DeconstructedSnowflake, GuildChannel, Permissions, PermissionOverwriteOptions, Message, MessageReaction, ReactionEmoji, MessageEmbed, TextBasedChannels, MessageOptions,
} from 'discord.js';

export default class CommandUtils {
  static async getSelfColor(channel: TextBasedChannels, bot: Bot): Promise<ColorResolvable> {
    let color: ColorResolvable | undefined;

    if (channel.type !== 'DM') {
      color = channel.guild.me?.displayColor;
    }

    // If no color or color is black, we want default color
    if (!color || color === 0) {
      color = bot.config.color;
    }

    return color;
  }

  static async splitCommandArgs(args: string, startPos?: number): Promise<string[]> {
    if (startPos === undefined) startPos = 0;
    return args.slice(startPos).split(/ +/);
  }

  static async parseMember(potentialMember: string, guild: Guild): Promise<GuildMember | undefined> {
    let parsedMember: GuildMember | undefined;
    const parsedUser: User | undefined = await CommandUtils.parseUser(potentialMember, guild.client);

    if (!parsedUser) {
      parsedMember = await this.parseMemberNickname(potentialMember, guild);
    } else {
      parsedMember = guild.members.cache.get(parsedUser.id);
    }

    return parsedMember;
  }

  static async parseMemberNickname(potentialMember: string, guild: Guild): Promise<GuildMember | undefined> {
    let parsedMember: GuildMember | undefined;
    potentialMember = potentialMember.toLowerCase();

    parsedMember = guild.members.cache.find((m) => m.nickname?.toLowerCase().startsWith(potentialMember) ?? false);

    return parsedMember;
  }

  static async parseMemberPingOnly(potentialMember: string, guild: Guild): Promise<GuildMember | undefined> {
    const parsedUser: User | undefined = await CommandUtils.parseUserPingOnly(potentialMember, guild.client);

    if (!parsedUser) {
      return undefined;
    }

    return guild.members.cache.get(parsedUser.id);
  }

  static async parseUser(potentialUser: string, client: Client): Promise<User | undefined> {
    let parsedUser: User | undefined;

    parsedUser = await CommandUtils.parseUserPingOnly(potentialUser, client);

    if (!parsedUser) {
      parsedUser = await CommandUtils.parseUserByName(potentialUser, client);
    }

    return parsedUser;
  }

  static async parseUserPingOnly(potentialUser: string, client: Client): Promise<User | undefined> {
    let parsedUser: User | undefined;

    try {
      const snowflake: Snowflake | undefined = await CommandUtils.parseUserID(potentialUser);
      if (snowflake) {
        parsedUser = await client.users.fetch(snowflake);
      }
    } catch (err) {}

    return parsedUser;
  }

  static async parseUserByName(potentialUser: string, client: Client): Promise<User | undefined> {
    let parsedUser: User | undefined;
    const lowerUser: string = potentialUser.toLowerCase();

    parsedUser = client.users.cache.find((u) => u.username.toLowerCase().startsWith(lowerUser) || u.tag === potentialUser);

    return parsedUser;
  }

  static async parseUserID(potentialUser: string): Promise<Snowflake | undefined> {
    let snowflake: string | undefined = potentialUser;

    if (snowflake.startsWith('<@') && snowflake.endsWith('>')) {
      snowflake = snowflake.slice(2, -1);
    }
    if (snowflake.startsWith('!')) {
      snowflake = snowflake.slice(1);
    }

    if (!await CommandUtils.verifySnowflake(snowflake)) {
      snowflake = undefined;
    }

    return snowflake;
  }

  static async parseRole(potentialRole: string, guild: Guild): Promise<Role | null> {
    let parsedRole: Role | null = null;
    const snowflake: Snowflake | null = await CommandUtils.parseRoleID(potentialRole, guild);

    if (snowflake) {
      parsedRole = await guild.roles.fetch(snowflake);
    }

    if (!parsedRole) {
      parsedRole = await CommandUtils.parseRoleByName(potentialRole, guild);
    }

    return parsedRole;
  }

  static async parseRoleByName(potentialRole: string, guild: Guild): Promise<Role | null> {
    let parsedRole: Role | null = null;
    const roleCache: Collection<Snowflake, Role> = guild.roles.cache;

    if (potentialRole === 'everyone') {
      parsedRole = guild.roles.everyone;
    } else {
      for (const role of roleCache.values()) {
        if (role.name.toLowerCase() === potentialRole.toLowerCase()) {
          parsedRole = role;
          break;
        }
      }
    }

    return parsedRole;
  }

  static async parseRoleID(potentialRole: string, guild: Guild): Promise<Snowflake | null> {
    let snowflake: Snowflake | null = potentialRole;
    if (snowflake.startsWith('<@&') && snowflake.endsWith('>')) {
      snowflake = snowflake.substring(3, snowflake.length - 1);
    }

    if (!await CommandUtils.verifySnowflake(snowflake)) {
      snowflake = null;
    }

    return snowflake;
  }

  static async parseTextChannel(potentialChannel: string, client: Client): Promise<TextBasedChannels | null> {
    const channel: Channel | null = await CommandUtils.parseChannel(potentialChannel, client);
    let parsedTextChannel: TextBasedChannels | null = null;

    if (!channel) {
      return null;
    }

    if (channel.isText()) {
      parsedTextChannel = <TextBasedChannels>channel;
    }

    return parsedTextChannel;
  }

  static async parseChannel(potentialChannel: string, client: Client): Promise<Channel | null> {
    let parsedChannel: Channel | null = null;

    try {
      const snowflake = await CommandUtils.parseChannelID(potentialChannel);
      if (snowflake) {
        parsedChannel = await client.channels.fetch(snowflake);
      }
    } catch (err) {}

    if (!parsedChannel) {
      const parsedUser: User | undefined = await CommandUtils.parseUserPingOnly(potentialChannel, client);
      if (parsedUser !== undefined) {
        parsedChannel = await parsedUser.createDM();
      }
    }
    return parsedChannel;
  }

  static async parseChannelID(potentialChannel: string): Promise<Snowflake | undefined> {
    let snowflake: Snowflake | undefined = potentialChannel;
    if (snowflake.startsWith('<#') && snowflake.endsWith('>')) {
      snowflake = snowflake.substring(2, potentialChannel.length - 1);
    }

    if (!await CommandUtils.verifySnowflake(snowflake)) {
      snowflake = undefined;
    }

    return snowflake;
  }

  static async parseEmote(potentialEmote: string, client: Client): Promise<GuildEmoji | null> {
    let parsedEmote: GuildEmoji | null = null;

    try {
      const snowflake: Snowflake | undefined = await CommandUtils.parseEmoteID(potentialEmote);
      if (snowflake) {
        parsedEmote = client.emojis.resolve(snowflake);
      }
    } catch (err) {}

    if (!parsedEmote) {
      parsedEmote = await CommandUtils.parseEmoteByName(potentialEmote, client) ?? null;
    }
    return parsedEmote;
  }

  static async parseEmoteByName(potentialEmote: string, client: Client): Promise<GuildEmoji | undefined> {
    const emoteName = potentialEmote.toLowerCase();
    const currEmote: GuildEmoji | undefined = client.emojis.cache.find((e) => e.name?.toLowerCase() === emoteName);

    return currEmote;
  }

  static async parseEmoteID(potentialEmote: string): Promise<Snowflake | undefined> {
    let snowflake: Snowflake | undefined = potentialEmote;
    if (snowflake.startsWith('<:') && snowflake.endsWith('>')) {
      snowflake = snowflake.substring(snowflake.lastIndexOf(':') + 1, snowflake.length - 1);
    }

    if (!await CommandUtils.verifySnowflake(snowflake)) {
      snowflake = undefined;
    }

    return snowflake;
  }

  static async parseWebhookUrl(potentialWebhook: string): Promise<WebhookClient> {
    const webhook: WebhookClient = new WebhookClient({ url: potentialWebhook });

    return webhook;
  }

  static async verifySnowflake(potentialSnowflake: string): Promise<boolean> {
    // Deconstruct snowflake
    const deconstructedSnowflake: DeconstructedSnowflake = SnowflakeUtil.deconstruct(potentialSnowflake);
    if (deconstructedSnowflake.timestamp <= SnowflakeUtil.EPOCH) {
      return false;
    }

    // We good
    return true;
  }

  static async updateChannelPerms(channel: GuildChannel, roles: Role[], users: User[], grantedPerms: Permissions, revokedPerms: Permissions, neutralPerms: Permissions, reason?: string): Promise<boolean> {
    // Check if we have permissions to edit channel
    if (!channel.guild.me || !channel.permissionsFor(channel.guild.me).has(Permissions.FLAGS.MANAGE_CHANNELS)) {
      return false;
    }

    // Remove ADMINISTRATOR (channels don't have ADMINISTRATOR)
    if (grantedPerms.has(Permissions.FLAGS.ADMINISTRATOR)) {
      grantedPerms.remove(Permissions.FLAGS.ADMINISTRATOR);
    }
    if (revokedPerms.has(Permissions.FLAGS.ADMINISTRATOR)) {
      revokedPerms.remove(Permissions.FLAGS.ADMINISTRATOR);
    }
    if (neutralPerms.has(Permissions.FLAGS.ADMINISTRATOR)) {
      neutralPerms.remove(Permissions.FLAGS.ADMINISTRATOR);
    }

    // Make overwrite options object
    const overwriteOptions: PermissionOverwriteOptions = {};
    for (const perm of grantedPerms.toArray()) {
      overwriteOptions[perm] = true;
    }
    for (const perm of revokedPerms.toArray()) {
      overwriteOptions[perm] = false;
    }
    for (const perm of neutralPerms.toArray()) {
      overwriteOptions[perm] = null;
    }

    // Try to update permissions
    try {
      for (const role of roles) {
        await channel.permissionOverwrites.edit(role, overwriteOptions, { reason });
      }
      for (const user of users) {
        await channel.permissionOverwrites.edit(user, overwriteOptions, { reason });
      }
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async getEmote(message: Message, bot: Bot): Promise<ReactionEmoji | GuildEmoji | undefined> {
    // Ask for emote
    const sentMessage: Message = await CommandUtils.sendMessage('Please react on this message with the emote you would like to use.', message.channel, bot);
    const reactions: Collection<string, MessageReaction> = await sentMessage.awaitReactions({ filter: (reaction, user) => user.id === message.author.id, time: 60000, max: 1 });

    // Check if unicode or if we have the custom emote
    if (reactions.size < 1) {
      await CommandUtils.sendMessage('No reaction given, cancelling.', message.channel, bot);
      return undefined;
    }

    let emote: ReactionEmoji | GuildEmoji | undefined = reactions.first()?.emoji;
    if (emote?.id && emote instanceof ReactionEmoji) {
      await CommandUtils.sendMessage('I do not have access to the emote given, cancelling.', message.channel, bot);
      emote = undefined;
    }

    return emote;
  }

  static async sendMessage(message: string, channel: TextBasedChannels, bot: Bot, repliedMessage?: Message): Promise<Message> {
    let messageSent: Message;

    const embed: MessageEmbed = new MessageEmbed()
      .setColor(await CommandUtils.getSelfColor(channel, bot))
      .setDescription(message);

    const options: MessageOptions = { embeds: [embed] };
    if (repliedMessage) {
      options.reply = { messageReference: repliedMessage };
    }

    messageSent = await channel.send(options);

    return messageSent;
  }

  public static async makeEmoteFromId(emoteId: string, message: Message): Promise<string | undefined> {
    let emote: string | undefined;

    try {
      emoteId = emoteId.split(':').pop() ?? '';
      if (emoteId !== '') {
        emote = message.client.emojis.resolve(emoteId)?.toString();
      }
    } catch (err) {
      if (emoteId.indexOf(':') === -1) {
        emote = decodeURI(emoteId);
      } else {
        emote = emoteId;
      }
    }

    return emote;
  }
}
