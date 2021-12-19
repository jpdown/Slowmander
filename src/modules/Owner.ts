import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { User, WebhookClient } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, guild, isOwner, noSlash } from "./ModuleDecorators";

export class Owner extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("sets the bots username")
    @guild("472222827421106201")
    @args([
        {
            name: "name",
            type: "string",
            description: "the new name for the bot",
        },
    ])
    @isOwner()
    public async setUsername(c: CommandContext, b: Bot, name: string) {
        if (name.length < 2) {
            await c.reply("Username must be more than 2 characters.");
            return;
        }
        try {
            await b.client.user.setUsername(name);
            await c.reply("Username changed successfully!");
        } catch (e) {
            await c.reply("Error while changing username.");
            console.log(e);
        }
    }

    @command("sets the bots avatar")
    @guild("472222827421106201")
    @args([{ name: "url", type: "string", description: "url for new avatar" }])
    @isOwner()
    public async setAvatar(c: CommandContext, b: Bot, url: string) {
        try {
            await b.client.user.setAvatar(url);
            await c.reply("Avatar changed successfully!");
        } catch (e) {
            await c.reply("Error while changing username.");
            console.log(e);
        }
    }

    @command("adds a bot owner")
    @guild("472222827421106201")
    @args([
        {
            name: "id",
            type: "string",
            description: "id to add",
            optional: true,
        },
        {
            name: "user",
            type: "user",
            description: "user to add",
            optional: true,
        },
    ])
    @isOwner()
    public async addOwner(c: CommandContext, b: Bot, id?: string, user?: User) {
        if (user) {
            if (await b.addOwner(user.id)) {
                await c.reply("Owner added successfully.");
            } else {
                await c.reply(`${user.toString()} is already an owner!`);
            }
        } else if (id) {
            if (await b.addOwner(id)) {
                await c.reply("Owner added successfully.");
            } else {
                await c.reply(`That user is already an owner!`);
            }
        } else {
            await c.reply("Please provide a valid user or id.");
        }
    }

    @command("removes a bot owner")
    @guild("472222827421106201")
    @args([
        {
            name: "id",
            type: "string",
            description: "id to remove",
            optional: true,
        },
        {
            name: "user",
            type: "user",
            description: "user to remove",
            optional: true,
        },
    ])
    @isOwner()
    public async removeOwner(
        c: CommandContext,
        b: Bot,
        id?: string,
        user?: User
    ) {
        if (user) {
            if (await b.removeOwner(user.id)) {
                await c.reply("Owner removed successfully.");
            } else {
                await c.reply(`${user.toString()} is not an owner!`);
            }
        } else if (id) {
            if (await b.removeOwner(id)) {
                await c.reply("Owner removed successfully.");
            } else {
                await c.reply(`That user is not an owner!`);
            }
        } else {
            await c.reply("Please provide a valid user or id.");
        }
    }

    @command("sets the bots current status")
    @guild("472222827421106201")
    @args([
        {
            name: "status",
            type: "string",
            description: "bots new status",
        },
    ])
    @isOwner()
    public async setStatus(c: CommandContext, b: Bot, status: string) {
        switch (status) {
            case "online":
                b.client.user!.setStatus("online");
                break;
            case "away":
            case "idle":
                b.client.user!.setStatus("idle");
                break;
            case "dnd":
                b.client.user!.setStatus("dnd");
                break;
            case "invis":
            case "invisible":
            case "offline":
                b.client.user!.setStatus("invisible");
                break;
            default:
        }
    }

    @command("sets the bots activity")
    @guild("472222827421106201")
    @args([
        {
            name: "activity",
            type: "string",
            description: "bots new activity",
        },
    ])
    @isOwner()
    public async setActivity(c: CommandContext, b: Bot, activity: string) {
        
    }

    @command("sets a new webhook for error logging for developers")
    @guild("472222827421106201")
    @args([
        {
            name: "name",
            type: "string",
            description: "the new name for the bot",
        },
    ])
    @isOwner()
    public async setErrorLogWebhook(c: CommandContext, b: Bot, name: string) {
        const utils = new CommandUtils(b);
        const webhook: WebhookClient = await utils.parseWebhookUrl(name);
        if (await b.config.setErrorWebhook(webhook)) {
            c.reply("Log webhook set successfully.");
        } else {
            c.reply("Failed to set the log webhook.");
        }
    }

    @command("gives the link to invite the bot to a server")
    @guild("472222827421106201")
    @isOwner()
    public async getInviteLink(c: CommandContext, b: Bot) {
        const invite = b.client.generateInvite({
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
}
