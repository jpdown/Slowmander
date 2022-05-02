import { Bot } from "Bot";
import { CommandContext } from "CommandContext";
import { Channel, GuildChannel, MessageEmbed, Permissions } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, group, guildOnly, isAdmin, permissions, subcommand } from "./ModuleDecorators";

//TODO
export class ClipModSettings extends Module {
    public constructor(b: Bot) {
        super(b);
    }

    @group("Manages Twitch Clip moderation")
    @guildOnly()
    @permissions(["MANAGE_MESSAGES"])
    public async clipmod(ctx: CommandContext<true>) {}

    @subcommand("clipmod", "Enables Twitch clip moderation settings for a channel")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "The channel"
        },
    ])
    @guildOnly()
    public async enable(ctx: CommandContext<true>, channel: Channel) {
        let bot = ctx.bot;

        if (
            !channel.isText() ||
            !(channel instanceof GuildChannel) ||
            !(channel.guild.id === ctx.guild.id)
        ) {
            await ctx.reply("Given channel is not a a text channel in this guild.");
            return;
        }

        const result = bot.db.twitchClipMod.enable(channel);
        let messageToSend = "";
        if (result) {
            messageToSend = `Twitch clip moderation successfully enabled for ${channel.toString()}`;
            // Check for Twitch API
            if (!(await bot.twitch.getApiStatus())) {
                messageToSend +=
                    "\nI do not have Twitch API access so verification will be solely through RegExp.";
            }
        } else {
            messageToSend = "Error enabling Twitch clip moderation.";
        }

        await ctx.reply(messageToSend);
    }

    @subcommand("clipmod", "Disables Twitch clip moderation settings for a channel")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "The channel"
        },
    ])
    @guildOnly()
    public async disable(ctx: CommandContext<true>, channel: Channel) {
        let bot = ctx.bot;

        if (
            !channel.isText() ||
            !(channel instanceof GuildChannel) ||
            !(channel.guild.id === ctx.guild.id)
        ) {
            await ctx.reply("Given channel is not a a text channel in this guild.");
            return;
        }

        const result = bot.db.twitchClipMod.disable(channel);
        let messageToSend = "";
        if (result) {
            messageToSend = `Twitch clip moderation successfully disabled for ${channel.toString()}`;
        } else {
            messageToSend = "Error enabling Twitch clip moderation.";
        }

        await ctx.reply(messageToSend);
    }

    @subcommand("clipmod", "Enables only allowing approved channels")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "The channel"
        },
    ])
    @guildOnly()
    public async enableapprovedchannels(ctx: CommandContext<true>, channel: Channel) {
        let bot = ctx.bot;

        if (
            !channel.isText() ||
            !(channel instanceof GuildChannel) ||
            !(channel.guild.id === ctx.guild.id)
        ) {
            await ctx.reply("Given channel is not a a text channel in this guild.");
            return;
        }

        // Check if we have Twitch
        if (!(await bot.twitch.getApiStatus())) {
            await ctx.reply("I do not have Twitch API access.");
            return;
        }

        if (bot.db.twitchClipMod.enableApprovedOnly(channel)) {
            await ctx.reply(`Successfully enabled approved channels in ${channel.toString()}`);
        } else {
            await ctx.reply(`Error enabling approved channels in ${channel.toString()}`);
        }
    }

    @subcommand("clipmod", "Disables only allowing approved channels")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "The channel"
        },
    ])
    @guildOnly()
    public async disableapprovedchannels(ctx: CommandContext<true>, channel: Channel) {
        let bot = ctx.bot;

        if (
            !channel.isText() ||
            !(channel instanceof GuildChannel) ||
            !(channel.guild.id === ctx.guild.id)
        ) {
            await ctx.reply("Given channel is not a a text channel in this guild.");
            return;
        }

        // Check if we have Twitch
        if (!(await bot.twitch.getApiStatus())) {
            await ctx.reply("I do not have Twitch API access");
            return;
        }

        if (bot.db.twitchClipMod.disableApprovedOnly(channel)) {
            await ctx.reply(`Successfully disabled approved channels in ${channel.toString()}`);
        } else {
            await ctx.reply(`Error disabling approved channels in ${channel.toString()}`);
        }
    }

    @subcommand("clipmod", "Adds a Twitch channel(s) to approved channels")
    @args([
        {
            name: "discordchannel",
            type: "channel",
            description: "The Discord channel"
        },
        {
            name: "twitchchannel",
            type: "string",
            description: "The Twitch channel"
        }
    ])
    @guildOnly()
    public async addchannel(ctx: CommandContext<true>, channel: Channel, twitchChan: string) {
        let bot = ctx.bot;

        if (
            !channel.isText() ||
            !(channel instanceof GuildChannel) ||
            !(channel.guild.id === ctx.guild.id)
        ) {
            await ctx.reply("Given channel is not a a text channel in this guild.");
            return;
        }

        // Check if we have Twitch
        if (!(await bot.twitch.getApiStatus())) {
            await ctx.reply("I do not have Twitch API access.");
            return;
        }

        // Get Twitch user
        const twitchUser: string | null = await bot.twitch.getUserId(twitchChan);
        if (!twitchUser) {
            await ctx.reply("Unknown issue getting Twitch channel");
            return;
        }

        let result = bot.db.twitchClipMod.addApprovedChannel(channel, twitchUser);

        if (!result) {
            await ctx.reply("Error adding channel.");
        } else {
            await ctx.reply('Successfully added channel');
        }
    }

    @subcommand("clipmod", "Deletes a Twitch channel(s) from approved channels")
    @args([
        {
            name: "discordchannel",
            type: "channel",
            description: "The Discord channel"
        },
        {
            name: "twitchchannel",
            type: "string",
            description: "The Twitch channel"
        }
    ])
    @guildOnly()
    public async deletechannel(ctx: CommandContext<true>, channel: Channel, twitchChan: string) {
        let bot = ctx.bot;

        if (
            !channel.isText() ||
            !(channel instanceof GuildChannel) ||
            !(channel.guild.id === ctx.guild.id)
        ) {
            await ctx.reply("Given channel is not a a text channel in this guild.");
            return;
        }

        // Check if we have Twitch
        if (!(await bot.twitch.getApiStatus())) {
            await ctx.reply("I do not have Twitch API access.");
            return;
        }

        // Get Twitch user
        const twitchUser: string | null = await bot.twitch.getUserId(twitchChan);
        if (!twitchUser) {
            await ctx.reply("Unknown issue getting Twitch channel");
            return;
        }

        let result = bot.db.twitchClipMod.removeApprovedChannel(channel, twitchUser);

        if (!result) {
            await ctx.reply("Error removing channel.");
        } else {
            await ctx.reply('Successfully removed channel');
        }
    }

    @subcommand("clipmod", "Gives info about clip moderation in a channel")
    @args([
        {
            name: "channel",
            type: "channel",
            description: "The channel"
        },
    ])
    @guildOnly()
    public async info(ctx: CommandContext<true>, channel: Channel) {
        let bot = ctx.bot;

        if (
            !channel.isText() ||
            !(channel instanceof GuildChannel) ||
            !(channel.guild.id === ctx.guild.id)
        ) {
            await ctx.reply("Given channel is not a a text channel in this guild.");
            return;
        }
        // Get config
        const config = bot.db.twitchClipMod.getChannelConfig(channel);
        const approvedChannels = bot.db.twitchClipMod.getApprovedChannels(channel);

        if (config === null || approvedChannels === null) {
            await ctx.reply("Error getting from db, please try again later.");
            return;
        }

        const embed: MessageEmbed = new MessageEmbed();
        embed.setColor(await CommandUtils.getSelfColor(ctx.channel));
        embed.setTitle("Twitch Clip Moderation Status");

        if (!config) {
            embed.addField("Enabled", "False", true);
        } else {
            embed.addField("Channel", channel.toString(), true);
            embed.addField("Enabled", config.enabled ? "True" : "False", true);
            embed.addField(
                "Twitch API",
                (await bot.twitch.getApiStatus()) ? "True" : "False",
                true
            );
            embed.addField("Approved Channels Only", config.approvedOnly ? "True" : "False", true);

            if (approvedChannels.length > 0) {
                const twitchUsers = await bot.twitch.getUsersByIds(approvedChannels);
                let usernames = "";
                if (twitchUsers) {
                    twitchUsers.forEach((user) => {
                        usernames += `${user.displayName}\n`;
                    });
                    embed.addField("Approved Channels", usernames, true);
                }
            } else {
                embed.addField("Approved Channels", "None", true);
            }
        }

        await ctx.reply({ embeds: [embed] });
    }
}
