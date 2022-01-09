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
    VoiceChannel,
} from "discord.js";
import { ButtonPaginator } from "utils/ButtonPaginator";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, group, guild, guildOnly, isMod, subcommand } from "./ModuleDecorators";

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
    @isMod()
    @guildOnly()
    public async lock(c: CommandContext<true>, m?: string) {
        //? for some reason i can't have one or theo ther with these args, i would like to give either a channel or a string of ids >:(
        /*if (channel) {
            this.perform(c, true, channel.id);
        } else 
        if (m) {
            this.perform(c, true, m);
        } else {
            this.perform(c, true, c.channel.id);
        }*/
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
    @isMod()
    @guildOnly()
    public async unlock(c: CommandContext<true>, channel?: GuildChannel, m?: string) {
        /*if (channel) {
            this.perform(c, false, channel.id);
        } else 
        if (m) {
            this.perform(c, false, m);
        } else {
            this.perform(c, false, c.channel.id);
        } */
    }

    @command("lcfg")
    @isMod()
    @guildOnly()
    public async lcfglist(c: CommandContext) {
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

    @command("lcfg")
    @isMod()
    @guildOnly()
    @args([{ name: "preset", type: "string", description: "ye", autocomplete: true, autocompleteFunc: Lockdown.getPresetList }])
    public async lcfginfo(c: CommandContext, input: string) {
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
        for (let c of channelList) {
            channelList.push(c);
        }
        for (let r of roleList) {
            roleList.push(r);
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
            `Channels in lockdown preset ${lockdownPreset.preset}`
        );
        await cListEmbed.postMessage();
        await rListEmbed.postMessage();
    }

    @command("lcfg")
    @isMod()
    @guildOnly()
    @args([{ name: "preset", type: "string", description: "ye" }])
    public async lcfgset(c: CommandContext<true>, preset: string) {
        await c.reply(":)!");
        //! look into select menus
        //! god i hate slash commands
        // await c.defer();
        // let arr: MessageSelectOptionData[] = [];
        // for (let ch of await c.guild.channels.fetch()) {
        //     if (ch instanceof GuildChannel) {
        //         arr.push({ label: ch.name, description: ch.name, value: ch.name });
        //     }
        // }
        // const row = new MessageActionRow().addComponents(
        //     new MessageSelectMenu()
        //         .setCustomId(`select`)
        //         .setPlaceholder(`None selected`)
        //         .addOptions(arr)
        // );
        // await c.channel.send({ content: "Select channels for preset:", components: [row] });
    }

    @command("lcfg")
    @isMod()
    @guildOnly()
    @args([
        { name: "preset", type: "string", description: "ye" },
        { name: "channel", type: "channel", description: "ye" },
        { name: "role", type: "role", description: "ye" },
    ])
    public async lcfgremove(c: CommandContext, input: string) {
        await c.reply(`Not implemented.`);
    }

    public static async getPresetList(guildId: string | null, bot: Bot): Promise<string[]> {
        if (!guildId) {
            return [];
        }
        return bot.db.lockdownPresets.getPresetList(guildId) ?? [];
    }

    private async perform(c: CommandContext, lock: boolean, m: string) {
        await c.defer();
        //? avoid splitting input into array if preset given?
        //? lmfao i forgot to handle the roles at all...
        const lockdownPreset = c.bot.db.lockdownPresets.getPreset(c.guild!.id, m);
        const lockdownChannels = c.bot.db.lockdownPresets.getPresetChannels(c.guild!.id, m);
        const lockdownRoles = c.bot.db.lockdownPresets.getPresetRoles(c.guild!.id, m);
        let channels: GuildChannel[] = [];
        let invalidIds: string[] = [];
        let roles: Role[] = [c.guild!.roles.everyone];
        let finalMsg = "";
        if (!lockdownPreset) {
            await c.reply({
                content: `No lockdown config found, please make one with \'${await c.bot.commandManager.getPrefix(
                    c.guild!.id
                )}managelockdown\`. The default preset is \`default\`.`,
            });
            return;
        }
        if (!lockdownPreset || !lockdownChannels || !lockdownRoles) {
            await c.reply({ content: `There was an error with the database.`, ephemeral: true });
            return false;
        }
        if (lockdownRoles.length > 0) {
            roles = [];
            for (let r of lockdownRoles) {
                let ids = c.guild!.roles.fetch(r);
                if (!ids) {
                    invalidIds.push(ids);
                    return;
                }
                if (ids instanceof Role) {
                    roles.push(ids);
                } else {
                    invalidIds.push(r);
                }
            }
        }
        for (let ch of lockdownChannels) {
            let chanIds = c.client.channels.fetch(ch);
            if (!chanIds) {
                invalidIds.push(ch);
                return;
            }
            if (chanIds instanceof GuildChannel) {
                channels.push(chanIds);
            } else {
                invalidIds.push(ch);
            }
        }
        //? maybe build the channels array before this block so i can check if it's empty before parsing ids
        //? because typically if locking with a preset, no ids will be provided in the message
        if (channels.length === 0) {
            //* verify we got IDs, and this should mean we didn't receive a preset
            let ids = m.split(" ");
            if (ids.length > 0) {
                for (let id of ids) {
                    let channel = await c.bot.client.channels.fetch(id);
                    if (!(channel instanceof GuildChannel)) return;
                    if (channel instanceof CategoryChannel) {
                        let categoryChannels = channel.children;
                        for (let categoryChannel of categoryChannels) {
                            if (
                                categoryChannel instanceof TextChannel ||
                                categoryChannel instanceof VoiceChannel
                            ) {
                                channels.push(categoryChannel);
                            }
                        }
                        continue;
                    }
                    if (channel) {
                        channels.push(channel);
                    } else {
                        invalidIds.push(id);
                    }
                }
                if (invalidIds.length > 0) {
                    finalMsg += `\nThe following IDs could not be resolved:\n`;
                    for (let invalid of invalidIds) {
                        finalMsg += `${invalid} `;
                    }
                    finalMsg += `\n`;
                }
            }
        } else {
            for (let channel of channels) {
                // for of and for in SMILEEEEEEEEEEEEEEEEEEEE
                if (channel) {
                    await this.updateChannelPerms(
                        channel,
                        //[c.guild!.roles.everyone],
                        roles,
                        lock,
                        false,
                        c
                    );
                } else {
                    await this.updateChannelPerms(
                        c.channel as GuildChannel,
                        //[c.guild!.roles.everyone],
                        roles,
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

    private static async parseChannels(
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
}
