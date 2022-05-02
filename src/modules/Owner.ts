import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { ActivityOptions, User, WebhookClient } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, group, guild, isOwner, permissions, subcommand } from "./ModuleDecorators";

export class Owner extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @group("Various owner only commands")
    @permissions(['ADMINISTRATOR'])
    @isOwner()
    public async owner(c: CommandContext) {}

    @subcommand("owner", "sets the bots username")
    @args([
        {
            name: "name",
            type: "string",
            description: "the new name for the bot",
        },
    ])
    @isOwner()
    public async username(c: CommandContext, name: string) {
        if (name.length < 2) {
            await c.reply("Username must be more than 2 characters.");
            return;
        }
        try {
            await c.bot.client.user.setUsername(name);
            await c.reply("Username changed successfully!");
        } catch (e) {
            await c.reply("Error while changing username.");
            this.logger.error("Error while changing username", e)
        }
    }

    @subcommand("owner", "sets the bots avatar")
    @args([
        {
            name: "url",
            type: "string",
            description: "url for new avatar",
        },
    ])
    @isOwner()
    public async avatar(c: CommandContext, url: string) {
        try {
            await c.defer();
            await c.bot.client.user.setAvatar(url);
            await c.reply("Avatar changed successfully!");
        } catch (e) {
            await c.reply("Error while changing avatar.");
            this.logger.error("Error while changing avatar", e)
        }
    }

    @subcommand("owner", "adds a bot owner")
    @args([
        {
            name: "user",
            type: "user",
            description: "user to add",
        },
    ])
    @isOwner()
    public async addowner(c: CommandContext, user: User) {
        if (await c.bot.addOwner(user.id)) {
            await c.reply("Owner added successfully.");
        } else {
            await c.reply(`${user.toString()} is already an owner!`);
        }
    }

    @subcommand("owner", "removes a bot owner")
    @args([
        {
            name: "user",
            type: "user",
            description: "user to remove",
        },
    ])
    @isOwner()
    public async removeowner(c: CommandContext, user: User) {
        if (await c.bot.removeOwner(user.id)) {
            await c.reply("Owner removed successfully.");
        } else {
            await c.reply(`${user.toString()} is not an owner!`);
        }
    }

    @subcommand("owner", "Sets the default prefix")
    @args([
        {
            name: "prefix",
            type: "string",
            description: "The prefix to use",
        },
    ])
    @isOwner()
    public async prefix(ctx: CommandContext, prefix: string) {
        const result = await ctx.bot.config.setPrefix(prefix);

        if (result) {
            await ctx.reply(`Default prefix set to ${prefix} successfully.`);
        } else {
            await ctx.reply("Default prefix was unable to be set.");
        }
    }

    @subcommand("owner", "sets the status")
    @args([
        {
            name: "status",
            type: "string",
            description: "bots new status",
            choices: [
                { name: "online", value: "online" },
                { name: "idle", value: "idle" },
                { name: "dnd", value: "dnd" },
                { name: "invisible", value: "invisible" },
            ],
        },
    ])
    @isOwner()
    public async status(c: CommandContext, status: string) {
        switch (status) {
            case "online":
                c.bot.client.user!.setStatus("online");
                break;
            case "idle":
                c.bot.client.user!.setStatus("idle");
                break;
            case "dnd":
                c.bot.client.user!.setStatus("dnd");
                break;
            case "invisible":
                c.bot.client.user!.setStatus("invisible");
                break;
        }

        await c.reply("Status changed successfully.");
    }

    @subcommand("owner", "sets the bots activity")
    @args([
        {
            name: "type",
            type: "string",
            description: "bots new activity type",
            choices: [
                { name: "playing", value: "playing" },
                { name: "streaming", value: "streaming" },
                { name: "listening", value: "listening" },
                { name: "watching", value: "watching" },
                { name: "competing", value: "competing" },
                { name: "clear", value: "clear" },
            ],
        },
        {
            name: "activity",
            type: "string",
            description: "bots new activity message",
            optional: true,
        },
    ])
    @isOwner()
    public async activity(c: CommandContext, type: string, activity?: string) {
        let activityOptions: ActivityOptions;
        let update = true;
        let reply = "Changing status...";
        if (!activity) {
            activity = "";
        }
        switch (type) {
            case "playing":
                activityOptions = { type: "PLAYING" };
                break;
            case "streaming":
                activityOptions = {
                    type: "STREAMING",
                    url: "https://twitch.tv/SIowmander",
                };
                break;
            case "listening":
                activityOptions = { type: "LISTENING" };
                break;
            case "watching":
                activityOptions = { type: "WATCHING" };
                break;
            case "competing":
                activityOptions = { type: "COMPETING" };
                break;
            case "clear":
                activity = "";
                activityOptions = {};
                break;
            default:
                update = false;
                activityOptions = {};
                reply = "Error parsing command, please try again.";
                break;
        }
        if (update) {
            c.bot.client.user!.setActivity(activity, activityOptions);
        }
        await c.reply(reply);
    }

    @subcommand("owner", "sets a new webhook for error logging for developers", "logwebhook")
    @args([
        {
            name: "url",
            type: "string",
            description: "the new error webhook",
        },
    ])
    @isOwner()
    public async setErrorLogWebhook(c: CommandContext, name: string) {
        const webhook: WebhookClient = await CommandUtils.parseWebhookUrl(name);
        if (await c.bot.config.setErrorWebhook(webhook)) {
            c.reply("Log webhook set successfully.");
        } else {
            c.reply("Failed to set the log webhook.");
        }
    }

    @subcommand("owner", "gives the link to invite the bot to a server", "getinvite")
    @isOwner()
    public async getInviteLink(c: CommandContext) {
        const invite = c.bot.client.generateInvite({
            scopes: ["applications.commands", "bot"],
            permissions: [
                "ADD_REACTIONS",
                "BAN_MEMBERS",
                "CHANGE_NICKNAME",
                "EMBED_LINKS",
                "KICK_MEMBERS",
                "MANAGE_CHANNELS",
                "MANAGE_MESSAGES",
                "MANAGE_NICKNAMES",
                "MANAGE_ROLES",
                "MANAGE_THREADS",
                "MANAGE_WEBHOOKS",
                "READ_MESSAGE_HISTORY",
                "SEND_MESSAGES",
                "USE_EXTERNAL_EMOJIS",
                "USE_EXTERNAL_STICKERS",
                "USE_PUBLIC_THREADS",
                "USE_PRIVATE_THREADS",
                "VIEW_AUDIT_LOG",
                "VIEW_CHANNEL",
            ],
        });
        await c.reply(`[Invite Link](${invite})`);
    }

    @command("shuts the bot down", "shutdown")
    @isOwner()
    public async shutdown(c: CommandContext) {
        await c.reply("Shutting down!");
        c.client.destroy();
        process.exit();
    }

    @subcommand("owner", "Checks discord.js version")
    @isOwner()
    public async djsv(c: CommandContext) {
        await c.reply(`Discord.js version: ${require("discord.js").version}`);
    }
}
