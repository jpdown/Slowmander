import { HelixUser } from "@twurple/api/lib";
import { Bot } from "Bot";
import { CommandContext } from "CommandContext";
import { MessageEmbed } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, group, isAdmin, subcommand } from "./ModuleDecorators";

//TODO
export class ClipModSettings extends Module {
    public constructor(b: Bot) {
        super(b);
    }

    @group("Manages Twitch Clip moderation")
    @isAdmin()
    public async clipmod(ctx: CommandContext<true>) {}

    @subcommand("clipmod", "Enables Twitch clip moderation settings for a channel")
    @args([
        {
            name: "id",
            type: "string",
            description: "ID of the channel"
        },
    ])
    @isAdmin()
    public async enable(ctx: CommandContext<true>, id: string) {
        let bot = ctx.bot;
        let args = [id]; // temporary to satisfy copy paste

        // args: 1 channel
        if (args.length < 1) {
            await ctx.reply("A channel ID must be provided");
            return;
        }

        // Parse channel
        const channel = await CommandUtils.parseTextChannel(args[0]);
        if (!channel || channel.type === "DM") {
            await ctx.reply("Given channel ID is invalid");
            return;
        }

        if (channel.guild.id !== ctx.guild!.id) {
            await ctx.reply("Please give a channel from this guild.");
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
            name: "id",
            type: "string",
            description: "ID of the channel"
        },
    ])
    @isAdmin()
    public async disable(ctx: CommandContext<true>, id: string) {
        let bot = ctx.bot;
        let args = [id];

        if (args.length < 1) {
            await ctx.reply("A channel ID must be provided");
            return;
        }

        // Parse channel
        const channel = await CommandUtils.parseTextChannel(args[0]);
        if (!channel || channel.type === "DM") {
            await ctx.reply("Given channel ID is invalid");
            return;
        }

        if (channel.guild.id !== ctx.guild!.id) {
            await ctx.reply("Please give a channel from this guild.");
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
            name: "id",
            type: "string",
            description: "ID of the channel"
        },
    ])
    @isAdmin()
    public async enableapprovedchannels(ctx: CommandContext<true>, id: string) {
        let bot = ctx.bot;
        let args = [id];

        if (args.length < 1) {
            return;
        }

        // Parse Discord channel
        const channel = await CommandUtils.parseTextChannel(args[0]);
        if (!channel || channel.type === "DM") {
            await ctx.reply("Given channel ID is invalid");
            return;
        }

        if (channel.guild.id !== ctx.guild!.id) {
            await CommandUtils.sendMessage("Please give a channel from this guild.", ctx.channel);
            return;
        }

        // Check if we have Twitch
        if (!(await bot.twitch.getApiStatus())) {
            await CommandUtils.sendMessage("I do not have Twitch API access.", ctx.channel);
            return;
        }

        if (bot.db.twitchClipMod.enableApprovedOnly(channel)) {
            await CommandUtils.sendMessage(
                `Successfully enabled approved channels in ${channel.toString()}`,
                ctx.channel
            );
        } else {
            await CommandUtils.sendMessage(
                `Error enabling approved channels in ${channel.toString()}`,
                ctx.channel
            );
        }
    }

    @subcommand("clipmod", "Disables only allowing approved channels")
    @args([
        {
            name: "id",
            type: "string",
            description: "ID of the channel"
        },
    ])
    @isAdmin()
    public async disableapprovedchannels(ctx: CommandContext<true>, id: string) {
        let bot = ctx.bot;
        let args = [id];

        if (args.length < 1) {
            return;
        }

        // Parse Discord channel
        const channel = await CommandUtils.parseTextChannel(args[0]);
        if (!channel || channel.type === "DM") {
            return;
        }

        if (channel.guild.id !== ctx.guild!.id) {
            await ctx.reply("Please give a channel from this guild");
            return;
        }

        // Check if we have Twitch
        if (!(await bot.twitch.getApiStatus())) {
            await ctx.reply("I do not have Twitch API access");
            return;
        }

        if (bot.db.twitchClipMod.disableApprovedOnly(channel)) {
            await ctx.reply(`Successfully disabled approved channels in ${channel.toString}`);
        } else {
            await ctx.reply(`Error disabling approved channels in ${channel.toString()}`);
        }
    }

    @subcommand("clipmod", "Adds a Twitch channel(s) to approved channels")
    @args([
        {
            name: "id",
            type: "string",
            description: "ID of the channel"
        },
        {
            name: "channel",
            type: "string",
            description: "Twitch channel"
        }
    ])
    @isAdmin()
    public async addchannel(ctx: CommandContext<true>, id: string, twitchChan: string) {
        let bot = ctx.bot;
        let args = [id, twitchChan];

        if (args.length < 2) {
            return;
        }

        // Parse Discord channel
        const channel = await CommandUtils.parseTextChannel(args[0]);
        if (!channel || channel.type === "DM") {
            return;
        }

        if (channel.guild.id !== ctx.guild!.id) {
            await ctx.reply("Please give a channel from this guild.");
            return;
        }

        // Check if we have Twitch
        if (!(await bot.twitch.getApiStatus())) {
            await ctx.reply("I do not have Twitch API access.");
            return;
        }

        // Get Twitch users
        const twitchUsers: HelixUser[] | null = await bot.twitch.getUserIds(args.slice(1));
        if (!twitchUsers) {
            await ctx.reply("Unknown issue getting Twitch channels");
            return;
        }

        const addedUsers: string[] = [];
        twitchUsers.forEach(async (user) => {
            if (user && bot.db.twitchClipMod.addApprovedChannel(channel, user.id)) {
                addedUsers.push(user.displayName);
            }
        });

        if (addedUsers.length === 0) {
            await ctx.reply("No channels added.");
        } else {
            await ctx.reply(`Successfully added channels: ${addedUsers.join(", ")}`);
        }
    }

    @subcommand("clipmod", "Deletes a Twitch channel(s) from approved channels")
    @args([
        {
            name: "id",
            type: "string",
            description: "ID of the channel"
        },
        {
            name: "channel",
            type: "string",
            description: "Twitch channel"
        }
    ])
    @isAdmin()
    public async deletechannel(ctx: CommandContext<true>, id: string, twitchChan: string) {
        let bot = ctx.bot;
        let args = [id, twitchChan];

        if (args.length < 2) {
            return;
        }

        // Parse Discord channel
        const channel = await CommandUtils.parseTextChannel(args[0]);
        if (!channel || channel.type === "DM") {
            return;
        }

        if (channel.guild.id !== ctx.guild!.id) {
            await ctx.reply("Please give a channel from this guild.");
            return;
        }

        // Check if we have Twitch
        if (!(await bot.twitch.getApiStatus())) {
            await ctx.reply("I do not have Twitch API access.");
            return;
        }

        // Get Twitch users
        const twitchUsers: HelixUser[] | null = await bot.twitch.getUserIds(args.slice(1));
        if (!twitchUsers) {
            await ctx.reply("Unknown issue getting Twitch channels");
            return;
        }

        const removedUsers: string[] = [];
        twitchUsers.forEach(async (user) => {
            if (bot.db.twitchClipMod.removeApprovedChannel(channel, user.id)) {
                removedUsers.push(user.displayName);
            }
        });

        if (removedUsers.length === 0) {
            await ctx.reply("No channels removed.");
        } else {
            await ctx.reply(`Successfully removed channels: ${removedUsers.join(", ")}`);
        }
    }

    @subcommand("clipmod", "Gives info about clip moderation in a channel")
    @args([
        {
            name: "id",
            type: "string",
            description: "ID of the channel"
        },
    ])
    @isAdmin()
    public async info(ctx: CommandContext<true>, id: string) {
        let bot = ctx.bot;
        let args = [id];

        if (args.length < 1) {
            return;
        }

        // Parse channel
        const channel = await CommandUtils.parseTextChannel(args[0]);
        if (!channel || channel.type === "DM") {
            return;
        }

        if (channel.guild.id !== ctx.guild!.id) {
            await ctx.reply("Please give a channel from this guild.");
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
