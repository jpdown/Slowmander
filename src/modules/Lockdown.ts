import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import {
    CategoryChannel,
    Guild,
    GuildChannel,
    GuildMember,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    MessageSelectOptionData,
    NewsChannel,
    Permissions,
    Role,
    TextBasedChannel,
    TextChannel,
    ThreadChannel,
    VoiceChannel,
} from "discord.js";
import { Logger } from "Logger";
import { ButtonPaginator } from "utils/ButtonPaginator";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, group, guild, guildOnly, isMod, subcommand } from "./ModuleDecorators";

// TODO refactor, this was copy pasted :)
export class Lockdown extends Module {
    private readonly PERMISSION = Permissions.FLAGS.SEND_MESSAGES;
    private readonly LOCK_MESSAGE = "🔒 Channel has been locked down.";
    private readonly UNLOCK_MESSAGE = "🔓 Channel has been unlocked.";

    public constructor(bot: Bot) {
        super(bot);
    }

    @command("Locks a server down.")
    @isMod()
    @guildOnly()
    @args([
        {
            name: "preset",
            type: "string",
            description: "The preset to lock with, blank for default.",
            autocomplete: true,
            autocompleteFunc: Lockdown.getPresetList,
            optional: true,
        },
    ])
    public async lockdown(c: CommandContext<true>, preset?: string) {
        try {
            await this.lockUnlock(c, true, preset);
        } catch (err) {
            await c.reply("Error locking server.");
            await this.logger.error(`Error locking guild ${c.guild.name}`, err);
        }
    }

    @command("Unlocks a server.")
    @isMod()
    @guildOnly()
    @args([
        {
            name: "preset",
            type: "string",
            description: "The preset to unlock, blank for default.",
            autocomplete: true,
            autocompleteFunc: Lockdown.getPresetList,
            optional: true,
        },
    ])
    public async unlock(c: CommandContext<true>, preset?: string) {
        try {
            await this.lockUnlock(c, false, preset);
        } catch (err) {
            await c.reply("Error unlocking server.");
            await this.logger.error(`Error unlocking guild ${c.guild.name}`, err);
        }
    }

    @group("Lockdown preset management.")
    @isMod()
    @guildOnly()
    public async managelockdown(c: CommandContext) {}

    @subcommand("managelockdown", "Lists lockdown presets.")
    @isMod()
    @guildOnly()
    public async list(c: CommandContext) {
        const lockdownPresets = c.bot.db.lockdownPresets.getPresetList(c.guild!.id);
        if (!lockdownPresets) {
            await c.reply(`Error getting from the database, please try again later.`);
            return;
        }
        if (lockdownPresets.length === 0) {
            await c.reply(`No presets found.`);
            return;
        }
        const paginator = new ButtonPaginator(
            lockdownPresets,
            c,
            10,
            `Lockdown presets for guild ${c.guild!.name}`
        );
        await paginator.postMessage();
    }

    @subcommand("managelockdown", "Gets information for a lockdown preset.")
    @isMod()
    @guildOnly()
    @args([
        {
            name: "preset",
            type: "string",
            description: "The preset to get information for.",
            autocomplete: true,
            autocompleteFunc: Lockdown.getPresetList,
        },
    ])
    public async info(c: CommandContext, input: string) {
        const guildId = c.guild!.id;
        const lockdownPreset = c.bot.db.lockdownPresets.getPreset(guildId, input);
        const lockdownChannels = c.bot.db.lockdownPresets.getPresetChannels(guildId, input);
        const lockdownRoles = c.bot.db.lockdownPresets.getPresetRoles(guildId, input);
        const channelList: string[] = [];
        const roleList: string[] = [];
        if (!lockdownPreset) {
            await c.reply(`No preset could be found with this name.`);
            return;
        }
        if (!lockdownChannels || !lockdownRoles) {
            await c.reply(`There was an error with the database.`);
            return;
        }
        // Make info embed
        const embed = new MessageEmbed()
            .setTitle(`Lockdown Preset ${lockdownPreset.preset}`)
            .addField("Permission Set To", lockdownPreset.grant ? "Grant" : "Neutral")
            .setColor(await CommandUtils.getSelfColor(c.channel));
        await c.reply({ embeds: [embed] });

        for (let c of lockdownChannels) {
            channelList.push(`<#${c}>`);
        }
        for (let r of lockdownRoles) {
            roleList.push(`<@&${r}>`);
        }
        const cListEmbed = new ButtonPaginator(
            channelList,
            c,
            10,
            `Channels in lockdown preset ${lockdownPreset.preset}`
        );
        const rListEmbed = new ButtonPaginator(
            roleList,
            c,
            10,
            `Roles in lockdown preset ${lockdownPreset.preset}`
        );
        await cListEmbed.postMessage();
        await rListEmbed.postMessage();
    }

    @subcommand("managelockdown", "Sets a lockdown preset.")
    @isMod()
    @guildOnly()
    @args([
        { name: "preset", type: "string", description: "The name of the preset." },
        { name: "channels", type: "string", description: "The list of channels, comma separated." },
        { name: "roles", type: "string", description: "The list of roles, comma separated." },
        {
            name: "grant",
            type: "bool",
            description: "Whether to set send messages to grant or neutral.",
        },
    ])
    // TODO: rewrite this with slash commands in mind
    public async set(
        c: CommandContext<true>,
        preset: string,
        channels: string,
        roles: string,
        grant: boolean
    ) {
        // Parse channels
        const channelResult: { result: boolean; parsedIDs: string[] } = await this.parseChannels(
            channels,
            c.guild
        );
        if (!channelResult.result) {
            await c.reply("One or more of the channels given was incorrect.");
            return;
        }

        // Parse roles
        const rolesResult = await this.parseRoles(roles, c.guild);
        console.log(rolesResult);
        if (!rolesResult.result) {
            await c.reply("One or more of the roles given was incorrect.");
            return;
        }

        // Try to save
        if (
            !c.bot.db.lockdownPresets.setPreset(
                c.guild.id,
                preset,
                grant,
                channelResult.parsedIDs,
                rolesResult.parsedIDs
            )
        ) {
            await c.reply("Error saving lockdown preset.");
        } else {
            await c.reply("Lockdown preset saved successfully.");
        }
    }

    @subcommand("managelockdown", "Removes a lockdown preset.")
    @isMod()
    @guildOnly()
    @args([{
        name: "preset",
        type: "string",
        description: "The preset to remove.",
        autocomplete: true,
        autocompleteFunc: Lockdown.getPresetList,
    },])
    public async remove(c: CommandContext<true>, input: string) {
        // Try to delete
        if (c.bot.db.lockdownPresets.removePreset(c.guild.id, input)) {
            await c.reply( `Lockdown preset ${input} removed successfully.`);
        } else {
            await c.reply(`Error removing lockdown preset ${input}, does it exist?`);
        }
    }

    public static async getPresetList(guildId: string | null, bot: Bot): Promise<string[]> {
        if (!guildId) {
            return [];
        }
        return bot.db.lockdownPresets.getPresetList(guildId) ?? [];
    }

    // TODO: This is copy paste, please make it better
    private async lockUnlock(
        c: CommandContext<true>,
        lock: boolean,
        preset?: string,
    ): Promise<boolean> {
        if (!preset) {
            preset = "default";
        }

        // Try to get config
        const lockdownConfig = c.bot.db.lockdownPresets.getPreset(c.guild.id, preset);
        if (lockdownConfig === undefined) {
            await c.reply(
                // eslint-disable-next-line max-len
                `No lockdown config found, please make one with \`${await c.bot.commandManager.getPrefix(
                    c.guild.id
                )}managelockdown\`. The default preset is \`default\`.`,
            );
            return false;
        }

        const lockdownChannels = c.bot.db.lockdownPresets.getPresetChannels(
            c.guild.id,
            preset
        );
        const lockdownRoles = c.bot.db.lockdownPresets.getPresetRoles(c.guild.id, preset);

        if (!lockdownConfig || !lockdownChannels || !lockdownRoles) {
            await c.reply(
                "There was an error with the database, please try again later.",
            );
            return false;
        }

        // Make lists
        const channels: GuildChannel[] = [];
        lockdownChannels.forEach((channelId) => {
            const parsedChannel: GuildChannel | ThreadChannel | null =
                c.guild.channels.resolve(channelId);
            if (parsedChannel && (parsedChannel as GuildChannel)) {
                channels.push(<GuildChannel>parsedChannel);
            }
        });

        const roles: Role[] = [];
        lockdownRoles.forEach((roleId) => {
            const parsedRole: Role | null = c.guild.roles.resolve(roleId);
            if (parsedRole) {
                roles.push(parsedRole);
            }
        });

        // Try to lockdown server
        const result: boolean = await this.updateChannelPerms(
            channels,
            roles,
            lock,
            lockdownConfig.grant,
            preset,
            c
        );
        if (!result) {
            await c.reply(
                `Missing permissions to ${lock ? "lock" : "unlock"} server.`,
            );
        } else {
            await c.reply(
                `Server ${lock ? "locked" : "unlocked"} successfully.`,
            );
        }

        return true;
    }

    // TODO: This is copy paste, please make it better
    private async updateChannelPerms(
        channels: GuildChannel[],
        roles: Role[],
        lock: boolean,
        grant: boolean,
        preset: string,
        c: CommandContext<true>
    ): Promise<boolean> {
        let reason = `${c.user.username}#${c.user.discriminator} performed ${preset} `;

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
        const modRoleId = c.bot.db.guildConfigs.getModRole(guild.id);
        if (modRoleId) {
            const modRole: Role | null = guild.roles.resolve(modRoleId);
            if (modRole) {
                modAndAdminRoles.push(modRole);
            }
        }
        const adminRoleId = c.bot.db.guildConfigs.getAdminRole(guild.id);
        if (adminRoleId) {
            const adminRole: Role | null = guild.roles.resolve(adminRoleId);
            if (adminRole) {
                modAndAdminRoles.push(adminRole);
            }
        }

        return channels.every(async (channel) => {
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
                    [c.bot.client.user],
                    new Permissions(this.PERMISSION),
                    zeroPerms,
                    zeroPerms,
                    reason
                );
                await this.trySendMessage(channel, lock, c);
                return true;
            }
            return false;
        });
    }

    private async parseChannels(
        channels: string,
        guild: Guild
    ): Promise<{ result: boolean; parsedIDs: string[] }> {
        const splitChannels: string[] = channels.split(",");

        let result = true;
        const parsedIDs: string[] = [];
        splitChannels.every(async (givenChannel) => {
            const parsedID: string | undefined = await CommandUtils.parseChannelID(givenChannel);
            // Make sure valid channel
            if (!parsedID || !guild.channels.resolve(parsedID)) {
                result = false;
                return false;
            }

            parsedIDs.push(parsedID);

            return true;
        });

        return { result, parsedIDs };
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

    // TODO: This is a copy paste, make it better or remove it
    private async parseRoles(
        roles: string,
        guild: Guild
    ): Promise<{ result: boolean; parsedIDs: string[] }> {
        const splitRoles: string[] = roles.split(",");

        let result = true;
        const parsedIDs: string[] = [];
        for (let role of splitRoles) {
            const parsedRole: Role | null = await CommandUtils.parseRole(role, guild);
            // Make sure valid role
            if (!parsedRole) {
                result = false;
                break;
            }

            parsedIDs.push(parsedRole.id);
        }

        return { result, parsedIDs };
    }

    // Partial work section
    // @command("locks a given channel")
    // @guild("472222827421106201")
    // @args([
    //     /* {
    //         name: "channel",
    //         type: "channel",
    //         description: "the channel to lock",
    //         optional: true,
    //     }, */
    //     {
    //         name: "channelids",
    //         type: "string",
    //         description: "list of channel ids to lock",
    //         optional: true,
    //     },
    // ])
    // @isMod()
    // @guildOnly()
    // public async lock(c: CommandContext<true>, m?: string) {
    //     //? for some reason i can't have one or theo ther with these args, i would like to give either a channel or a string of ids >:(
    //     /*if (channel) {
    //         this.perform(c, true, channel.id);
    //     } else
    //     if (m) {
    //         this.perform(c, true, m);
    //     } else {
    //         this.perform(c, true, c.channel.id);
    //     }*/
    // }

    // @command("unlocks a given channel")
    // @guild("472222827421106201")
    // @args([
    //     /* {
    //         name: "channel",
    //         type: "channel",
    //         description: "the channel to lock",
    //         optional: true,
    //     }, */
    //     {
    //         name: "channelids",
    //         type: "string",
    //         description: "list of channel ids to lock",
    //         optional: true,
    //     },
    // ])
    // @isMod()
    // @guildOnly()
    // public async unlock(c: CommandContext<true>, channel?: GuildChannel, m?: string) {
    //     /*if (channel) {
    //         this.perform(c, false, channel.id);
    //     } else
    //     if (m) {
    //         this.perform(c, false, m);
    //     } else {
    //         this.perform(c, false, c.channel.id);
    //     } */
    // }
    // private async perform(c: CommandContext, lock: boolean, m: string) {
    //     await c.defer();
    //     //? avoid splitting input into array if preset given?
    //     //? lmfao i forgot to handle the roles at all...
    //     const lockdownPreset = c.bot.db.lockdownPresets.getPreset(c.guild!.id, m);
    //     const lockdownChannels = c.bot.db.lockdownPresets.getPresetChannels(c.guild!.id, m);
    //     const lockdownRoles = c.bot.db.lockdownPresets.getPresetRoles(c.guild!.id, m);
    //     let channels: GuildChannel[] = [];
    //     let invalidIds: string[] = [];
    //     let roles: Role[] = [c.guild!.roles.everyone];
    //     let finalMsg = "";
    //     if (!lockdownPreset) {
    //         await c.reply({
    //             content: `No lockdown config found, please make one with \'${await c.bot.commandManager.getPrefix(
    //                 c.guild!.id
    //             )}managelockdown\`. The default preset is \`default\`.`,
    //         });
    //         return;
    //     }
    //     if (!lockdownPreset || !lockdownChannels || !lockdownRoles) {
    //         await c.reply({ content: `There was an error with the database.`, ephemeral: true });
    //         return false;
    //     }
    //     if (lockdownRoles.length > 0) {
    //         roles = [];
    //         for (let r of lockdownRoles) {
    //             let ids = c.guild!.roles.fetch(r);
    //             if (!ids) {
    //                 invalidIds.push(ids);
    //                 return;
    //             }
    //             if (ids instanceof Role) {
    //                 roles.push(ids);
    //             } else {
    //                 invalidIds.push(r);
    //             }
    //         }
    //     }
    //     for (let ch of lockdownChannels) {
    //         let chanIds = c.client.channels.fetch(ch);
    //         if (!chanIds) {
    //             invalidIds.push(ch);
    //             return;
    //         }
    //         if (chanIds instanceof GuildChannel) {
    //             channels.push(chanIds);
    //         } else {
    //             invalidIds.push(ch);
    //         }
    //     }
    //     //? maybe build the channels array before this block so i can check if it's empty before parsing ids
    //     //? because typically if locking with a preset, no ids will be provided in the message
    //     if (channels.length === 0) {
    //         //* verify we got IDs, and this should mean we didn't receive a preset
    //         let ids = m.split(" ");
    //         if (ids.length > 0) {
    //             for (let id of ids) {
    //                 let channel = await c.bot.client.channels.fetch(id);
    //                 if (!(channel instanceof GuildChannel)) return;
    //                 if (channel instanceof CategoryChannel) {
    //                     let categoryChannels = channel.children;
    //                     for (let categoryChannel of categoryChannels) {
    //                         if (
    //                             categoryChannel instanceof TextChannel ||
    //                             categoryChannel instanceof VoiceChannel
    //                         ) {
    //                             channels.push(categoryChannel);
    //                         }
    //                     }
    //                     continue;
    //                 }
    //                 if (channel) {
    //                     channels.push(channel);
    //                 } else {
    //                     invalidIds.push(id);
    //                 }
    //             }
    //             if (invalidIds.length > 0) {
    //                 finalMsg += `\nThe following IDs could not be resolved:\n`;
    //                 for (let invalid of invalidIds) {
    //                     finalMsg += `${invalid} `;
    //                 }
    //                 finalMsg += `\n`;
    //             }
    //         }
    //     } else {
    //         for (let channel of channels) {
    //             // for of and for in SMILEEEEEEEEEEEEEEEEEEEE
    //             if (channel) {
    //                 await this.updateChannelPerms(
    //                     channel,
    //                     //[c.guild!.roles.everyone],
    //                     roles,
    //                     lock,
    //                     false,
    //                     c
    //                 );
    //             } else {
    //                 await this.updateChannelPerms(
    //                     c.channel as GuildChannel,
    //                     //[c.guild!.roles.everyone],
    //                     roles,
    //                     lock,
    //                     false,
    //                     c
    //                 );
    //             }
    //         }
    //         if (!c.replied) {
    //             finalMsg += "Channel(s) locked!";
    //             await c.reply({ content: finalMsg, ephemeral: true });
    //             return;
    //         }
    //         return;
    //     }
    //     await c.reply({ content: "No channels found from given IDs!", ephemeral: true });
    // }
}
