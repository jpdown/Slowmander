import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { Channel, GuildChannel, Role } from "discord.js";
import { Module } from "./Module";
import { args, group, isAdmin, subcommand } from "./ModuleDecorators";

export class Set extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @group("Commands for setting options on the bot")
    public async set(c: CommandContext) {}

    @subcommand("set", "Sets the prefix for the current guild")
    @args([
        {
            name: "prefix",
            type: "string",
            description: "the new prefix",
        },
    ])
    @isAdmin()
    public async prefix(c: CommandContext, prefix: string) {
        if (c.bot.db.guildConfigs.setPrefix(c.guild!.id, prefix)) {
            await c.reply(`Prefix for ${c.guild!.name} set to ${prefix} successfully.`);
        } else {
            await c.reply(`Prefix was unable to be set for ${c.guild!.name}.`);
        }
    }

    @subcommand("set", "Sets the vip role for the current guild")
    @args([
        {
            name: "role",
            type: "role",
            description: "the vip role",
        },
    ])
    @isAdmin()
    public async viprole(c: CommandContext, role: Role) {
        if (!role) {
            await c.reply(`Role could not be found!`);
        } else {
            if (c.bot.db.guildConfigs.setVipRole(c.guild!.id, role.id)) {
                await c.reply(`VIP role for ${c.guild!.name} set to ${role.name}!`);
            } else {
                await c.reply(`Role was unable to be set for guild.`);
            }
        }
    }

    @subcommand("set", "Sets the mod role for the current guild")
    @args([
        {
            name: "role",
            type: "role",
            description: "the mod role",
        },
    ])
    @isAdmin()
    public async modrole(c: CommandContext, role: Role) {
        if (!role) {
            await c.reply(`Role could not be found!`);
        } else {
            if (c.bot.db.guildConfigs.setModRole(c.guild!.id, role.id)) {
                await c.reply(`Mod role for ${c.guild!.name} set to ${role.name}!`);
            } else {
                await c.reply(`Role was unable to be set for guild.`);
            }
        }
    }

    @subcommand("set", "Sets the admin role for the current guild")
    @args([
        {
            name: "role",
            type: "role",
            description: "the admin role",
        },
    ])
    @isAdmin()
    public async adminrole(c: CommandContext, role: Role) {
        if (!role) {
            await c.reply(`Role could not be found!`);
        } else {
            if (c.bot.db.guildConfigs.setAdminRole(c.guild!.id, role.id)) {
                await c.reply(`Admin role for ${c.guild!.name} set to ${role.name}!`);
            } else {
                await c.reply(`Role was unable to be set for guild.`);
            }
        }
    }

    @subcommand("set", "Sets the log channel for the current guild")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "the log channel",
        },
    ])
    @isAdmin()
    public async eventlog(c: CommandContext, channel: GuildChannel) {
        if (!channel) {
            await c.reply(`Channel could not be found!`);
        } else {
            if (c.bot.db.eventLogs.setChannel(c.guild!.id, channel.id)) {
                await c.reply(`Log channel for ${c.guild!.name} set to ${channel.name}!`);
            } else {
                await c.reply(`Channel was unable to be set for guild.`);
            }
        }
    }

    @subcommand("set", "Sets the log channel for the current guild")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "the mod channel",
        },
    ])
    @isAdmin()
    public async modchannel(c: CommandContext, channel: GuildChannel) {
        if (!channel) {
            await c.reply(`Channel could not be found!`);
        } else {
            if (c.bot.db.guildConfigs.setModChannel(c.guild!.id, channel.id)) {
                await c.reply(`Mod channel for ${c.guild!.name} set to ${channel.name}!`);
            } else {
                await c.reply(`Channel was unable to be set for guild.`);
            }
        }
    }
}
