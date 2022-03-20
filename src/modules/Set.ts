import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { GuildChannel, Role } from "discord.js";
import { Module } from "./Module";
import { args, group, guildOnly, isAdmin, subcommand } from "./ModuleDecorators";

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
    @guildOnly()
    public async prefix(c: CommandContext<true>, prefix: string) {
        if (c.bot.db.guildConfigs.setPrefix(c.guild.id, prefix)) {
            await c.reply(`Prefix for ${c.guild.name} set to ${prefix} successfully.`);
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
    @guildOnly()
    public async viprole(c: CommandContext<true>, role: Role) {
        if (!role) {
            await c.reply(`Role could not be found!`);
        } else {
            if (c.bot.db.guildConfigs.setVipRole(c.guild.id, role.id)) {
                await c.reply(`VIP role for ${c.guild.name} set to ${role.name}!`);
                await c.bot.commandManager.deploySlashPermissions(c.guild);
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
    @guildOnly()
    public async modrole(c: CommandContext<true>, role: Role) {
        if (!role) {
            await c.reply(`Role could not be found!`);
        } else {
            if (c.bot.db.guildConfigs.setModRole(c.guild.id, role.id)) {
                await c.reply(`Mod role for ${c.guild.name} set to ${role.name}!`);
                await c.bot.commandManager.deploySlashPermissions(c.guild);
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
    @guildOnly()
    public async adminrole(c: CommandContext<true>, role: Role) {
        if (!role) {
            await c.reply(`Role could not be found!`);
        } else {
            if (c.bot.db.guildConfigs.setAdminRole(c.guild.id, role.id)) {
                await c.reply(`Admin role for ${c.guild.name} set to ${role.name}!`);
                await c.bot.commandManager.deploySlashPermissions(c.guild);
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
    @guildOnly()
    public async eventlog(c: CommandContext<true>, channel: GuildChannel) {
        if (!channel) {
            await c.reply(`Channel could not be found!`);
        } else {
            if (c.bot.db.eventLogs.setChannel(c.guild.id, channel.id)) {
                await c.reply(`Log channel for ${c.guild.name} set to ${channel.name}!`);
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
    @guildOnly()
    public async modchannel(c: CommandContext<true>, channel: GuildChannel) {
        if (!channel) {
            await c.reply(`Channel could not be found!`);
        } else {
            if (c.bot.db.guildConfigs.setModChannel(c.guild.id, channel.id)) {
                await c.reply(`Mod channel for ${c.guild.name} set to ${channel.name}!`);
            } else {
                await c.reply(`Channel was unable to be set for guild.`);
            }
        }
    }

    @subcommand("set", "Sets whether the bot will autoban link spammers")
    @args([
        {
            name: "enabled",
            type: "bool",
            description: "Whether to ban",
        },
    ])
    @isAdmin()
    @guildOnly()
    public async spamban(c: CommandContext<true>, enabled: boolean) {
        if (c.bot.db.guildConfigs.setSpamBan(c.guild.id, enabled)) {
            await c.reply(`Spam ban for ${c.guild.name} successfully ${enabled ? 'enabled' : 'disabled'}!`);
        } else {
            await c.reply(`Spam ban was unable to be set for guild.`);
        }
    }
}
