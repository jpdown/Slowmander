import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';

import {Message, Permissions, MessageEmbed, Channel, TextChannel, NewsChannel, DMChannel} from 'discord.js';
import { CommandUtils } from '../utils/CommandUtils';
import { CommandGroup } from './CommandGroup';
import { TwitchClipModObject } from '../config/TwitchClipModConfig';
import { HelixUser } from 'twitch/lib';

export class ManageTwitchClipMod extends CommandGroup {
    constructor(bot: PantherBot) {
        super("twitchclip", "Manages Twitch Clip moderation", bot, {runsInDm: false});

        this.registerSubCommands(bot);
    }

    protected registerSubCommands(bot: PantherBot): void {
        this.registerSubCommand(new EnableClipModeration(this, bot));
        this.registerSubCommand(new DisableClipModeration(this, bot));
        this.registerSubCommand(new EnableApprovedChannels(this, bot));
        this.registerSubCommand(new DisableApprovedChannels(this, bot));
        this.registerSubCommand(new AddTwitchChannel(this, bot));
        this.registerSubCommand(new DeleteTwitchChannel(this, bot));
        this.registerSubCommand(new ChannelModInfo(this, bot));
    }
}

class EnableClipModeration extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("enable", PermissionLevel.Admin, "Enables Twitch clip moderation settings for a channel", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if (args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        // Parse channel
        let channel: TextChannel | NewsChannel | DMChannel = await CommandUtils.parseTextChannel(args[0], message.client);
        if (!channel || channel.type === "dm") {
            return {sendHelp: true, command: this, message: message};
        }
        
        if (channel.guild.id !== message.guild.id) {
            await CommandUtils.sendMessage("Please give a channel from this guild.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let result = await bot.configs.twitchClipModConfig.enableChannelTwitchClipMod(channel.id);
        let messageToSend: string = "";
        if (result) {
            messageToSend = "Twitch clip moderation successfully enabled for " + channel.toString();
            // Check for Twitch API
            if (!await bot.twitchApiManager.getApiStatus()) {
                messageToSend += "\nI do not have Twitch API access so verification will be solely through RegExp."
            }
        }
        else {
            messageToSend = "Error enabling Twitch clip moderation.";
        }

        await CommandUtils.sendMessage(messageToSend, message.channel, bot);
        return {sendHelp: false, command: this, message: message};
    }
}

class DisableClipModeration extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("disable", PermissionLevel.Admin, "Disables Twitch clip moderation settings for a channel", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if (args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        // Parse channel
        let channel: TextChannel | NewsChannel | DMChannel = await CommandUtils.parseTextChannel(args[0], message.client);
        if (!channel || channel.type === "dm") {
            return {sendHelp: true, command: this, message: message};
        }
        
        if (channel.guild.id !== message.guild.id) {
            await CommandUtils.sendMessage("Please give a channel from this guild.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let result = await bot.configs.twitchClipModConfig.disableChannelTwitchClipMod(channel.id);
        let messageToSend: string = "";
        if (result) {
            messageToSend = "Twitch clip moderation successfully disabled for " + channel.toString();
        }
        else {
            messageToSend = "Error disabling Twitch clip moderation.";
        }

        await CommandUtils.sendMessage(messageToSend, message.channel, bot);
        return {sendHelp: false, command: this, message: message};
    }
}

class EnableApprovedChannels extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("enableapproved", PermissionLevel.Admin, "Enables only allowing approved channels", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if (args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        // Parse Discord channel
        let channel: TextChannel | NewsChannel | DMChannel = await CommandUtils.parseTextChannel(args[0], message.client);
        if (!channel || channel.type === "dm") {
            return {sendHelp: true, command: this, message: message};
        }
        
        if (channel.guild.id !== message.guild.id) {
            await CommandUtils.sendMessage("Please give a channel from this guild.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        // Check if we have Twitch
        if (!await bot.twitchApiManager.getApiStatus()) {
            await CommandUtils.sendMessage("I do not have Twitch API access.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        if (await bot.configs.twitchClipModConfig.enableApprovedChannels(channel.id)) {
            await CommandUtils.sendMessage("Successfully enabled approved channels in " + channel.toString(), message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage("Error enabling approved channels in " + channel.toString(), message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class DisableApprovedChannels extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("disableapproved", PermissionLevel.Admin, "Disables only allowing approved channels", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if (args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        // Parse Discord channel
        let channel: TextChannel | NewsChannel | DMChannel = await CommandUtils.parseTextChannel(args[0], message.client);
        if (!channel || channel.type === "dm") {
            return {sendHelp: true, command: this, message: message};
        }
        
        if (channel.guild.id !== message.guild.id) {
            await CommandUtils.sendMessage("Please give a channel from this guild.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        // Check if we have Twitch
        if (!await bot.twitchApiManager.getApiStatus()) {
            await CommandUtils.sendMessage("I do not have Twitch API access.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        if (await bot.configs.twitchClipModConfig.disableApprovedChannels(channel.id)) {
            await CommandUtils.sendMessage("Successfully disabled approved channels in " + channel.toString(), message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage("Error disabling approved channels in " + channel.toString(), message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}
class AddTwitchChannel extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("addchannel", PermissionLevel.Admin, "Adds a Twitch channel(s) to approved channels", bot, {usage: "<channel> <twitch channel..>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if (args.length < 2) {
            return {sendHelp: true, command: this, message: message};
        }

        // Parse Discord channel
        let channel: TextChannel | NewsChannel | DMChannel = await CommandUtils.parseTextChannel(args[0], message.client);
        if (!channel || channel.type === "dm") {
            return {sendHelp: true, command: this, message: message};
        }
        
        if (channel.guild.id !== message.guild.id) {
            await CommandUtils.sendMessage("Please give a channel from this guild.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        // Check if we have Twitch
        if (!await bot.twitchApiManager.getApiStatus()) {
            await CommandUtils.sendMessage("I do not have Twitch API access.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        // Get Twitch users
        let twitchUsers: HelixUser[] = await bot.twitchApiManager.getUserIds(args.slice(1));
        if (!twitchUsers) {
            await CommandUtils.sendMessage("Unknown issue getting Twitch channels", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let addedUsers: string[] = [];
        for (let user of twitchUsers) {
            if (user && await bot.configs.twitchClipModConfig.addApprovedChannel(channel.id, user.id)) {
                addedUsers.push(user.displayName);
            }
        }

        if (addedUsers.length === 0) {
            await CommandUtils.sendMessage("No channels added.", message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage("Successfully added channels: " + addedUsers.join(", "), message.channel, bot);
        }
        return {sendHelp: false, command: this, message: message};
    }
}

class DeleteTwitchChannel extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("delchannel", PermissionLevel.Admin, "Deletes a Twitch channel(s) from approved channels", bot, {usage: "<channel> <twitch channel..>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if (args.length < 2) {
            return {sendHelp: true, command: this, message: message};
        }

        // Parse Discord channel
        let channel: TextChannel | NewsChannel | DMChannel = await CommandUtils.parseTextChannel(args[0], message.client);
        if (!channel || channel.type === "dm") {
            return {sendHelp: true, command: this, message: message};
        }
        
        if (channel.guild.id !== message.guild.id) {
            await CommandUtils.sendMessage("Please give a channel from this guild.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        // Check if we have Twitch
        if (!await bot.twitchApiManager.getApiStatus()) {
            await CommandUtils.sendMessage("I do not have Twitch API access.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        // Get Twitch users
        let twitchUsers: HelixUser[] = await bot.twitchApiManager.getUserIds(args.slice(1));
        if (!twitchUsers) {
            await CommandUtils.sendMessage("Unknown issue getting Twitch channels", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let removedUsers: string[] = [];
        for (let user of twitchUsers) {
            if (user && await bot.configs.twitchClipModConfig.removeApprovedChannel(channel.id, user.id)) {
                removedUsers.push(user.displayName);
            }
        }

        if (removedUsers.length === 0) {
            await CommandUtils.sendMessage("No channels removed.", message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage("Successfully removed channels: " + removedUsers.join(", "), message.channel, bot);
        }
        return {sendHelp: false, command: this, message: message};
    }
}

class ChannelModInfo extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("info", PermissionLevel.Admin, "Gives info about clip moderation in a channel", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if (args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        // Parse channel
        let channel: TextChannel | NewsChannel | DMChannel = await CommandUtils.parseTextChannel(args[0], message.client);
        if (!channel || channel.type === "dm") {
            return {sendHelp: true, command: this, message: message};
        }
        
        if (channel.guild.id !== message.guild.id) {
            await CommandUtils.sendMessage("Please give a channel from this guild.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let responseMessage: Message = await CommandUtils.sendMessage("Getting info...", message.channel, bot);

        // Get config
        let config: TwitchClipModObject = await bot.configs.twitchClipModConfig.getChannelTwitchClipMod(channel.id);

        let embed: MessageEmbed = new MessageEmbed();
        embed.setColor(await CommandUtils.getSelfColor(message.channel, bot));
        embed.setTitle("Twitch Clip Moderation Status");

        if (!config) {
            embed.addField("Enabled", "False", true);
        }

        else {
            embed.addField("Channel", channel.toString(), true);
            embed.addField("Enabled", config.enabled ? "True" : "False", true);
            embed.addField("Twitch API", await bot.twitchApiManager.getApiStatus() ? "True" : "False", true);
            embed.addField("Approved Channels Only", config.approvedChannelsOnly ? "True" : "False", true);

            if (config.twitchChannels && config.twitchChannels.length > 0) {
                let twitchUsers: HelixUser[] = await bot.twitchApiManager.getUsersByIds(config.twitchChannels);
                let usernames: string = "";
                for (let user of twitchUsers) {
                    if (user) {
                        usernames += user.displayName + "\n"
                    }
                }
                embed.addField("Approved Channels", usernames, true);
            }
            else {
                embed.addField("Approved Channels", "None", true);
            }
        }

        responseMessage.edit(embed);
        return {sendHelp: false, command: this, message: message};
    }
}