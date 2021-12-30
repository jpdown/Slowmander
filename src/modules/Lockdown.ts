import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import {
    CategoryChannel,
    Channel,
    Guild,
    GuildChannel,
    GuildMember,
    MessageEmbed,
    NewsChannel,
    Permissions,
    Role,
    TextBasedChannel,
    TextChannel,
    VoiceChannel,
} from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, guild, guildOnly } from "./ModuleDecorators";

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
        /* {
            name: "channel",
            type: "channel",
            description: "the channel to lock",
            optional: true,
        }, */
        {
            name: "channelids",
            type: "string",
            description: "list of channel ids to lock",
            optional: true,
        },
    ])
    public async lock(c: CommandContext, m?: string) {
        // TODO allow giving guild ids as input and figure out how the heck to make these arguments work
        /*if (channel) {
            this.perform(c, true, channel.id);
        } else 
        if (m) {
            this.perform(c, true, m);
        } else {
            this.perform(c, true, c.channel.id);
        }*/
        await c.reply("not working yet");
    }

    @command("unlocks a given channel")
    @guild("472222827421106201")
    @args([
        /* {
            name: "channel",
            type: "channel",
            description: "the channel to lock",
            optional: true,
        }, */
        {
            name: "channelids",
            type: "string",
            description: "list of channel ids to lock",
            optional: true,
        },
    ])
    public async unlock(c: CommandContext, channel?: GuildChannel, m?: string) {
        /*if (channel) {
            this.perform(c, false, channel.id);
        } else 
        if (m) {
            this.perform(c, false, m);
        } else {
            this.perform(c, false, c.channel.id);
        } */
        await c.reply("not working yet");
    }

    private async perform(c: CommandContext, lock: boolean, m: string) {
        await c.defer();
        let ids = m.split(" ");
        let channels: GuildChannel[] = [];
        let failed: string[] = [];
        let guilds: Guild[] = [];
        let finalMsg = "";
        if (ids.length > 0) {
            // verify we got IDs
            for (let i = 0; i < ids.length; i++) {
                let guild = await c.bot.client.guilds.fetch(ids[0]).catch((e) => {
                    console.log(`MissingAccess on getting guild`, e);
                });
                if (guild) {
                    guilds.push(guild);
                    continue;
                }
                let ch = await c
                    .guild!.channels.fetch(ids[i])
                    .catch((e) => console.log(`MissingAccess on getting channel`, e));
                if (ch instanceof CategoryChannel) {
                    let catChannels = ch.children;
                    for (let i = 0; i < catChannels.size; i++) {
                        let channel = catChannels.at(i);
                        if (channel instanceof TextChannel || channel instanceof VoiceChannel) {
                            channels.push(channel);
                        }
                    }
                    continue;
                }
                if (ch) {
                    channels.push(ch);
                } else {
                    failed.push(ids[i]);
                }
            }
            if (failed.length > 0) {
                finalMsg += `\nThe following IDs could not be resolved:\n`;
                for (let i = 0; i < failed.length; i++) {
                    finalMsg += `${failed[i]} `;
                }
                finalMsg += `\n`;
            }
        }
        if (channels.length > 0) {
            for (let i = 0; i < channels.length; i++) {
                let channel = channels[i];
                if (channel) {
                    await this.updateChannelPerms(
                        channel,
                        [c.guild!.roles.everyone],
                        lock,
                        false,
                        c
                    );
                } else {
                    await this.updateChannelPerms(
                        c.channel as GuildChannel,
                        [c.guild!.roles.everyone],
                        lock,
                        false,
                        c
                    );
                }
            }
            if (!c.replied) {
                finalMsg += "Channel(s) locked!";
                await c.reply({ content: finalMsg, ephemeral: true });
                return;
            }
            return;
        }
        await c.reply({ content: "No channels found from given IDs!", ephemeral: true });
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
            await CommandUtils.updateChannelPerms(
                channel,
                roles,
                [],
                grantedPerms,
                revokedPerms,
                neutralPerms,
                reason
            )
        ) {
            await CommandUtils.updateChannelPerms(
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
            (channel as CategoryChannel).children.forEach(async (childChannel) => {
                if (childChannel.permissionsLocked) {
                    await this.trySendMessage(childChannel, lock, ctx);
                }
            });
            return true;
        }
        // Check perms
        const member: GuildMember = channel.guild.members.cache.get(bot.client.user!.id)!;
        if (!channel.permissionsFor(member).has(Permissions.FLAGS.SEND_MESSAGES)) {
            return false;
        }
        const embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(<TextChannel | NewsChannel>channel))
            .setDescription(lock ? this.LOCK_MESSAGE : this.UNLOCK_MESSAGE);

        if (ctx.channel.id === channel.id) {
            await ctx.reply({ embeds: [embed] });
            return true;
        }
        await (<TextBasedChannel>channel).send({ embeds: [embed] });
        return true;
    }
}
