import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import {
    CategoryChannel,
    GuildChannel,
    GuildMember,
    MessageEmbed,
    NewsChannel,
    Permissions,
    Role,
    TextBasedChannel,
    TextChannel,
} from "discord.js";
import { Module } from "./Module";
import { args, command, guild } from "./ModuleDecorators";

// TODO handle the command when it's not used as a slash command, and refactor
export class Lockdown extends Module {
    private readonly PERMISSION = Permissions.FLAGS.SEND_MESSAGES;
    private readonly LOCK_MESSAGE = "🔒 Channel has been locked down.";
    private readonly UNLOCK_MESSAGE = "🔓 Channel has been unlocked.";

    public constructor(bot: Bot) {
        super(bot);
    }

    @command("locks a given channel")
    @guild("472222827421106201")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "the channel to lock",
            optional: true,
        },
    ])
    public async lock(c: CommandContext, channel?: GuildChannel) {
        this.perform(c, true, channel);
    }

    @command("unlocks a given channel")
    @guild("472222827421106201")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "the channel to unlock",
            optional: true,
        },
    ])
    public async unlock(c: CommandContext, channel?: GuildChannel) {
        this.perform(c, false, channel);
    }

    private async perform(
        c: CommandContext,
        lock: boolean,
        channel?: GuildChannel
    ) {
        if (!c.guild) return; // TODO temporary check, add a way to make commands guild only
        await c.defer();
        if (channel) {
            await this.updateChannelPerms(
                channel,
                [c.guild?.roles.everyone],
                lock,
                false,
                c
            );
        } else {
            await this.updateChannelPerms(
                c.channel as GuildChannel,
                [c.guild?.roles.everyone],
                lock,
                false,
                c
            );
        }
        if (!c.replied) {
            await c.reply("Channel(s) locked!");
        }
    }

    private async updateChannelPerms(
        channel: GuildChannel,
        roles: Role[],
        lock: boolean,
        grant: boolean,
        ctx: CommandContext
    ): Promise<boolean> {
        let executor = ctx.user;
        let bot = ctx.bot;
        let reason = `${executor.username}#${executor.discriminator} modified ${channel.name}, `;

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
        const { guild } = channel;
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
            await this.trySendMessage(channel, lock, ctx);
            return true;
        }
        return false;
    }

    private async trySendMessage(
        channel: GuildChannel,
        lock: boolean,
        ctx: CommandContext
    ): Promise<boolean> {
        let bot = ctx.bot;
        // if not a channel we can send messages in
        if (!channel.isText() && channel.type !== "GUILD_CATEGORY") {
            return false;
        }
        // If category, send in all children recursively
        if (channel.type === "GUILD_CATEGORY") {
            (channel as CategoryChannel).children.forEach(
                async (childChannel) => {
                    if (childChannel.permissionsLocked) {
                        await this.trySendMessage(childChannel, lock, ctx);
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

        if (ctx.channel.id === channel.id) {
            await ctx.reply({ embeds: [embed] });
            return true;
        }
        await (<TextBasedChannel>channel).send({ embeds: [embed] });
        return true;
    }
}
