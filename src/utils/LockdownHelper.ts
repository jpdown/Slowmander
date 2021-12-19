import type { Bot } from "Bot";

import {
    Permissions,
    Message,
    GuildChannel,
    ThreadChannel,
    Role,
    CategoryChannel,
    GuildMember,
    MessageEmbed,
    NewsChannel,
    TextChannel,
    User,
} from "discord.js";

export class LockdownHelper {
    static readonly PERMISSION = Permissions.FLAGS.SEND_MESSAGES;

    static readonly LOCK_MESSAGE = "🔒 Channel has been locked down.";

    static readonly UNLOCK_MESSAGE = "🔓 Channel has been unlocked.";

    static async lockUnlock(
        bot: Bot,
        message: Message,
        args: string[],
        lock: boolean
    ): Promise<boolean> {
        let preset = "default";

        if (args.length > 0) {
            [preset] = args;
        }

        // Try to get config
        const lockdownConfig = bot.db.lockdownPresets.getPreset(
            message.guild!.id,
            preset
        );
        if (lockdownConfig === undefined) {
            await bot.utils.sendMessage(
                // eslint-disable-next-line max-len
                `No lockdown config found, please make one with \`${await bot.commandManager.getPrefix(
                    message.guild?.id
                )}managelockdown\`. The default preset is \`default\`.`,
                message.channel
            );
            return false;
        }

        const lockdownChannels = bot.db.lockdownPresets.getPresetChannels(
            message.guild!.id,
            preset
        );
        const lockdownRoles = bot.db.lockdownPresets.getPresetRoles(
            message.guild!.id,
            preset
        );

        if (!lockdownConfig || !lockdownChannels || !lockdownRoles) {
            await bot.utils.sendMessage(
                "There was an error with the database, please try again later.",
                message.channel
            );
            return false;
        }

        // Make lists
        const channels: GuildChannel[] = [];
        lockdownChannels.forEach((channelId) => {
            const parsedChannel: GuildChannel | ThreadChannel | null =
                message.guild!.channels.resolve(channelId);
            if (parsedChannel && (parsedChannel as GuildChannel)) {
                channels.push(<GuildChannel>parsedChannel);
            }
        });

        const roles: Role[] = [];
        lockdownRoles.forEach((roleId) => {
            const parsedRole: Role | null =
                message.guild!.roles.resolve(roleId);
            if (parsedRole) {
                roles.push(parsedRole);
            }
        });

        // Try to lockdown server
        const result: boolean = await LockdownHelper.updateChannelPerms(
            channels,
            roles,
            lock,
            lockdownConfig.grant,
            message.author,
            preset,
            bot
        );
        if (!result) {
            await bot.utils.sendMessage(
                `Missing permissions to ${lock ? "lock" : "unlock"} server.`,
                message.channel
            );
        } else {
            await bot.utils.sendMessage(
                `Server ${lock ? "locked" : "unlocked"} successfully.`,
                message.channel
            );
        }

        return true;
    }

    // eslint-disable-next-line max-len
    static async updateChannelPerms(
        channels: GuildChannel[],
        roles: Role[],
        lock: boolean,
        grant: boolean,
        executor: User,
        preset: string,
        bot: Bot
    ): Promise<boolean> {
        let reason = `${executor.username}#${executor.discriminator} performed ${preset} `;

        const zeroPerms: Permissions = new Permissions(0n);
        let neutralPerms: Permissions = zeroPerms;
        let grantedPerms: Permissions = zeroPerms;
        let revokedPerms: Permissions = zeroPerms;
        if (lock) {
            revokedPerms = new Permissions(this.PERMISSION);
            reason += "lockdown";
        } else {
            if (grant) {
                grantedPerms = new Permissions(this.PERMISSION);
            } else {
                neutralPerms = new Permissions(this.PERMISSION);
            }
            reason += "unlock";
        }

        // Get mod and admin role (if applicable)
        const { guild } = channels[0];
        const modAndAdminRoles: Role[] = [];
        const modRoleId = bot.db.guildConfigs.getModRole(guild.id);
        if (modRoleId) {
            const modRole: Role | null = guild.roles.resolve(modRoleId);
            if (modRole) {
                modAndAdminRoles.push(modRole);
            }
        }
        const adminRoleId = bot.db.guildConfigs.getAdminRole(guild.id);
        if (adminRoleId) {
            const adminRole: Role | null = guild.roles.resolve(adminRoleId);
            if (adminRole) {
                modAndAdminRoles.push(adminRole);
            }
        }

        return channels.every(async (channel) => {
            if (
                await bot.utils.updateChannelPerms(
                    channel,
                    roles,
                    [],
                    grantedPerms,
                    revokedPerms,
                    neutralPerms,
                    reason
                )
            ) {
                await bot.utils.updateChannelPerms(
                    channel,
                    modAndAdminRoles,
                    [bot.client.user],
                    new Permissions(this.PERMISSION),
                    zeroPerms,
                    zeroPerms,
                    reason
                );
                await this.trySendMessage(channel, lock, bot);
                return true;
            }
            return false;
        });
    }

    static async trySendMessage(
        channel: GuildChannel,
        lock: boolean,
        bot: Bot
    ): Promise<boolean> {
        // if not a channel we can send messages in
        if (!channel.isText() && channel.type !== "GUILD_CATEGORY") {
            return false;
        }
        // If category, send in all children recursively
        if (channel.type === "GUILD_CATEGORY") {
            (channel as CategoryChannel).children.forEach(
                async (childChannel) => {
                    if (childChannel.permissionsLocked) {
                        await this.trySendMessage(childChannel, lock, bot);
                    }
                }
            );
            return true;
        }
        // Check perms
        const member: GuildMember = channel.guild.members.cache.get(
            bot.client.user!.id
        )!;
        if (
            !channel.permissionsFor(member).has(Permissions.FLAGS.SEND_MESSAGES)
        ) {
            return false;
        }
        const embed = new MessageEmbed()
            .setColor(
                await bot.utils.getSelfColor(<TextChannel | NewsChannel>channel)
            )
            .setDescription(lock ? this.LOCK_MESSAGE : this.UNLOCK_MESSAGE);

        await (<TextChannel | NewsChannel>channel).send({ embeds: [embed] });
        return true;
    }
}
