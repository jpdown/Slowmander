import type { Bot } from "Bot";
import type { CommandArgumentType } from "commands/Command";

import {
    ColorResolvable,
    User,
    Collection,
    Snowflake,
    Guild,
    GuildMember,
    Role,
    Channel,
    GuildEmoji,
    WebhookClient,
    SnowflakeUtil,
    DeconstructedSnowflake,
    GuildChannel,
    Permissions,
    PermissionOverwriteOptions,
    Message,
    MessageReaction,
    ReactionEmoji,
    MessageEmbed,
    TextBasedChannel,
    MessageOptions,
    ApplicationCommandOptionType,
    AnyChannel,
} from "discord.js";
import { Logger } from "Logger";

export class CommandUtils {
    public static bot: Bot;
    private static logger: Logger = Logger.getLogger("Command Utils");

    public static async getSelfColor(channel: TextBasedChannel): Promise<ColorResolvable> {
        let color: ColorResolvable | undefined;

        if (channel.type !== "DM") {
            color = channel.guild.me?.displayColor;
        }

        // If no color or color is black, we want default color
        if (!color || color === 0) {
            color = this.bot.config.color;
        }

        return color;
    }

    public static async parseMember(
        potentialMember: string,
        guild: Guild
    ): Promise<GuildMember | undefined> {
        let parsedMember: GuildMember | undefined;
        const parsedUser: User | undefined = await this.parseUser(
            potentialMember
        );

        if (!parsedUser) {
            parsedMember = await this.parseMemberNickname(
                potentialMember,
                guild
            );
        } else {
            parsedMember = guild.members.cache.get(parsedUser.id);
        }

        return parsedMember;
    }

    // eslint-disable-next-line class-methods-use-this
    public static async parseMemberNickname(
        potentialMember: string,
        guild: Guild
    ): Promise<GuildMember | undefined> {
        const lowerMember = potentialMember.toLowerCase();

        const parsedMember = guild.members.cache.find(
            (m) => m.nickname?.toLowerCase().startsWith(lowerMember) ?? false
        );

        return parsedMember;
    }

    public static async parseMemberPingOnly(
        potentialMember: string,
        guild: Guild
    ): Promise<GuildMember | undefined> {
        const parsedUser: User | undefined = await this.parseUserPingOnly(
            potentialMember
        );

        if (!parsedUser) {
            return undefined;
        }

        return guild.members.cache.get(parsedUser.id);
    }

    public static async parseUser(potentialUser: string): Promise<User | undefined> {
        let parsedUser: User | undefined;

        parsedUser = await this.parseUserPingOnly(potentialUser);

        if (!parsedUser) {
            parsedUser = await this.parseUserByName(potentialUser);
        }

        return parsedUser;
    }

    public static async parseUserPingOnly(potentialUser: string): Promise<User | undefined> {
        let parsedUser: User | undefined;

        try {
            const snowflake: Snowflake | undefined = await this.parseUserID(
                potentialUser
            );
            if (snowflake) {
                parsedUser = await this.bot.client.users.fetch(snowflake);
            }
        } catch (err) {
            // Invalid snowflake
            parsedUser = undefined;
        }

        return parsedUser;
    }

    public static async parseUserByName(potentialUser: string): Promise<User | undefined> {
        const lowerUser: string = potentialUser.toLowerCase();

        const parsedUser = this.bot.client.users.cache.find(
            (u) =>
                u.username.toLowerCase() === lowerUser ||
                u.tag === potentialUser
        );

        return parsedUser;
    }

    public static async parseUserID(potentialUser: string): Promise<Snowflake | undefined> {
        let snowflake: string | undefined = potentialUser;

        if (snowflake.startsWith("<@") && snowflake.endsWith(">")) {
            snowflake = snowflake.slice(2, -1);
        }
        if (snowflake.startsWith("!")) {
            snowflake = snowflake.slice(1);
        }

        if (!(await this.verifySnowflake(snowflake))) {
            snowflake = undefined;
        }

        return snowflake;
    }

    public static async parseRole(potentialRole: string, guild: Guild): Promise<Role | null> {
        let parsedRole: Role | null = null;
        const snowflake: Snowflake | null = await this.parseRoleID(
            potentialRole
        );

        if (snowflake) {
            parsedRole = await guild.roles.fetch(snowflake);
        }

        if (!parsedRole) {
            parsedRole = await this.parseRoleByName(potentialRole, guild);
        }

        return parsedRole;
    }

    // eslint-disable-next-line class-methods-use-this
    public static async parseRoleByName(
        potentialRole: string,
        guild: Guild
    ): Promise<Role | null> {
        let parsedRole: Role | null = null;
        const roleCache: Collection<Snowflake, Role> = guild.roles.cache;
        const lowerRole = potentialRole.toLowerCase();

        if (potentialRole === "everyone") {
            parsedRole = guild.roles.everyone;
        } else {
            roleCache.find((role) => role.name.toLowerCase() === lowerRole);
        }

        return parsedRole;
    }

    public static async parseRoleID(potentialRole: string): Promise<Snowflake | null> {
        let snowflake: Snowflake | null = potentialRole;
        if (snowflake.startsWith("<@&") && snowflake.endsWith(">")) {
            snowflake = snowflake.substring(3, snowflake.length - 1);
        }

        if (!(await this.verifySnowflake(snowflake))) {
            snowflake = null;
        }

        return snowflake;
    }

    public static async parseTextChannel(
        potentialChannel: string
    ): Promise<TextBasedChannel | null> {
        const channel: Channel | null = await this.parseChannel(
            potentialChannel
        );
        let parsedTextChannel: TextBasedChannel | null = null;

        if (!channel) {
            return null;
        }

        if (channel.isText()) {
            parsedTextChannel = <TextBasedChannel>channel;
        }

        return parsedTextChannel;
    }

    public static async parseChannel(potentialChannel: string): Promise<Channel | null> {
        let parsedChannel: Channel | null = null;

        try {
            const snowflake = await this.parseChannelID(potentialChannel);
            if (snowflake) {
                parsedChannel = <Channel>await this.bot.client.channels.fetch(snowflake); // todo more typing
            }
        } catch (err) {
            parsedChannel = null;
        }

        if (!parsedChannel) {
            const parsedUser: User | undefined = await this.parseUserPingOnly(
                potentialChannel
            );
            if (parsedUser !== undefined) {
                parsedChannel = await parsedUser.createDM();
            }
        }
        return parsedChannel;
    }

    public static async parseChannelID(
        potentialChannel: string
    ): Promise<Snowflake | undefined> {
        let snowflake: Snowflake | undefined = potentialChannel;
        if (snowflake.startsWith("<#") && snowflake.endsWith(">")) {
            snowflake = snowflake.substring(2, potentialChannel.length - 1);
        }

        if (!(await this.verifySnowflake(snowflake))) {
            snowflake = undefined;
        }

        return snowflake;
    }

    public static async parseEmote(potentialEmote: string): Promise<GuildEmoji | null> {
        let parsedEmote: GuildEmoji | null = null;

        try {
            const snowflake: Snowflake | undefined = await this.parseEmoteID(
                potentialEmote
            );
            if (snowflake) {
                parsedEmote = this.bot.client.emojis.resolve(snowflake);
            }
        } catch (err) {
            parsedEmote = null;
        }

        if (!parsedEmote) {
            parsedEmote = (await this.parseEmoteByName(potentialEmote)) ?? null;
        }
        return parsedEmote;
    }

    public static async parseEmoteByName(
        potentialEmote: string
    ): Promise<GuildEmoji | undefined> {
        const emoteName = potentialEmote.toLowerCase();
        const currEmote: GuildEmoji | undefined =
            this.bot.client.emojis.cache.find(
                (e) => e.name?.toLowerCase() === emoteName
            );

        return currEmote;
    }

    public static async parseEmoteID(potentialEmote: string): Promise<Snowflake | undefined> {
        let snowflake: Snowflake | undefined = potentialEmote;
        if (snowflake.startsWith("<:") && snowflake.endsWith(">")) {
            snowflake = snowflake.substring(
                snowflake.lastIndexOf(":") + 1,
                snowflake.length - 1
            );
        }

        if (!(await this.verifySnowflake(snowflake))) {
            snowflake = undefined;
        }

        return snowflake;
    }

    // eslint-disable-next-line class-methods-use-this
    public static async parseWebhookUrl(potentialWebhook: string): Promise<WebhookClient> {
        const webhook: WebhookClient = new WebhookClient({
            url: potentialWebhook,
        });

        return webhook;
    }

    // eslint-disable-next-line class-methods-use-this
    public static async verifySnowflake(potentialSnowflake: string): Promise<boolean> {
        // Deconstruct snowflake
        const deconstructedSnowflake: DeconstructedSnowflake =
            SnowflakeUtil.deconstruct(potentialSnowflake);
        if (deconstructedSnowflake.timestamp <= SnowflakeUtil.EPOCH) {
            return false;
        }

        // We good
        return true;
    }

    // eslint-disable-next-line class-methods-use-this
    public static async updateChannelPerms(
        channel: GuildChannel,
        roles: Role[],
        users: User[],
        grantedPerms: Permissions,
        revokedPerms: Permissions,
        neutralPerms: Permissions,
        reason?: string
    ): Promise<boolean> {
        // Check if we have permissions to edit channel
        if (
            !channel.guild.me ||
            !channel
                .permissionsFor(channel.guild.me)
                .has(Permissions.FLAGS.MANAGE_CHANNELS)
        ) {
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
        grantedPerms.toArray().forEach((perm) => {
            overwriteOptions[perm] = true;
        });
        revokedPerms.toArray().forEach((perm) => {
            overwriteOptions[perm] = false;
        });
        neutralPerms.toArray().forEach((perm) => {
            overwriteOptions[perm] = null;
        });

        // Try to update permissions
        roles.forEach(async (role) => {
            await channel.permissionOverwrites.edit(role, overwriteOptions, {
                reason,
            });
        });
        users.forEach(async (user) => {
            await channel.permissionOverwrites.edit(user, overwriteOptions, {
                reason,
            });
        });

        return true;
    }

    public static async getEmote(
        message: Message
    ): Promise<ReactionEmoji | GuildEmoji | undefined> {
        // Ask for emote
        const sentMessage: Message = await this.sendMessage(
            "Please react on this message with the emote you would like to use.",
            message.channel
        );
        const reactions: Collection<string, MessageReaction> =
            await sentMessage.awaitReactions({
                filter: (reaction, user) => user.id === message.author.id,
                time: 60000,
                max: 1,
            });

        // Check if unicode or if we have the custom emote
        if (reactions.size < 1) {
            await this.sendMessage(
                "No reaction given, cancelling.",
                message.channel
            );
            return undefined;
        }

        let emote: ReactionEmoji | GuildEmoji | undefined =
            reactions.first()?.emoji;
        if (emote?.id && emote instanceof ReactionEmoji) {
            await this.sendMessage(
                "I do not have access to the emote given, cancelling.",
                message.channel
            );
            emote = undefined;
        }

        return emote;
    }

    public static async sendMessage(
        message: string,
        channel: TextBasedChannel,
        repliedMessage?: Message
    ): Promise<Message> {
        const embed: MessageEmbed = new MessageEmbed()
            .setColor(await this.getSelfColor(channel))
            .setDescription(message);

        const options: MessageOptions = { embeds: [embed] };
        if (repliedMessage) {
            options.reply = { messageReference: repliedMessage };
        }

        return channel.send(options);
    }

    // eslint-disable-next-line class-methods-use-this
    public static async makeEmoteFromId(emoteId: string): Promise<string | undefined> {
        let emote: string | undefined;
        let newEmoteId: string;

        try {
            newEmoteId = emoteId.split(":").pop() ?? "";
            if (newEmoteId !== "") {
                emote = this.bot.client.emojis.resolve(newEmoteId)?.toString();
            }
        } catch (err) {
            if (emoteId.indexOf(":") === -1) {
                emote = decodeURI(emoteId);
            } else {
                emote = emoteId;
            }
        }

        return emote;
    }

    public static getSlashArgType(
        type: CommandArgumentType
    ): Exclude<
        ApplicationCommandOptionType,
        "SUB_COMMAND" | "SUB_COMMAND_GROUP"
    > {
        switch (type) {
            case "string":
                return "STRING";
            case "int":
                return "INTEGER";
            case "number":
                return "NUMBER";
            case "bool":
                return "BOOLEAN";
            case "user":
            case "member":
                return "USER";
            case "channel":
                return "CHANNEL";
            case "role":
                return "ROLE";
            default:
                // TODO: Add exhaustiveness check with never
                this.logger.debug(
                    "Default STRING case on SlashArgType " + type
                );
                return "STRING";
        }
    }
}
