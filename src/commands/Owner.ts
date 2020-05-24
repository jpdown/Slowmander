import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message, User, ActivityOptions, WebhookClient } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";

export class Owner extends CommandGroup {
    constructor(bot: PantherBot) {
        super("owner", "Owner commands (you know this already)", bot);

        this.registerSubCommands(bot);
    }

    protected registerSubCommands(bot: PantherBot): void {
        this.registerSubCommand(new SetUsername(this, bot));
        this.registerSubCommand(new SetAvatar(this, bot));
        this.registerSubCommand(new AddOwner(this, bot));
        this.registerSubCommand(new RemoveOwner(this, bot));
        this.registerSubCommand(new SetDefaultPrefix(this, bot));
        this.registerSubCommand(new SetStatus(this, bot));
        this.registerSubCommand(new SetActivity(this, bot));
        this.registerSubCommand(new SetErrorLogWebhook(this, bot));
        this.registerSubCommand(new GetInviteLink(this, bot));
    }
}

class SetUsername extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("name", PermissionLevel.Owner, "Sets bot username.", bot, {usage: "<username>", group: group, longDesc: "Minimum username length is 2 characters."});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let newUsername: string = args.join(" ");

        if(newUsername.length < 2) {
            return {sendHelp: true, command: this, message: message};
        }

        try {
            await message.client.user.setUsername(newUsername);
            await this.sendMessage("Username changed successfully.", message.channel, bot);
        }
        catch(err) {
            await this.sendMessage("Error changing username, check log for details.", message.channel, bot);
            await this.logger.error("Error changing username.", err);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetAvatar extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("avatar", PermissionLevel.Owner, "Sets bot avatar", bot, {usage: "<image url>", group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }
        try {
            await message.client.user.setAvatar(args[0]);
            await this.sendMessage("Avatar changed successfully.", message.channel, bot);
        }
        catch(err) {
            await this.sendMessage("Error changing avatar, check log for details.", message.channel, bot);
            await this.logger.error("Error changing avatar.", err);
        }
        return {sendHelp: false, command: this, message: message};
    }
}

class AddOwner extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("addowner", PermissionLevel.Owner, "Adds a bot owner", bot, {usage: "<owner>", group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let user: User = await CommandUtils.parseUser(args.join(" "), message.client);

        if(user === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        if(await bot.addOwner(user.id)) {
            await this.sendMessage(`Owner ${user.toString()} added successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage(`User ${user.toString()} is already an owner.`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class RemoveOwner extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("removeowner", PermissionLevel.Owner, "Removes a bot owner", bot, {usage: "<owner>", group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let user: User = await CommandUtils.parseUser(args.join(" "), message.client);

        if(user === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        if(await bot.removeOwner(user.id)) {
            await this.sendMessage(`Owner ${user.toString()} removed successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage(`User ${user.toString()} is not an owner.`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetDefaultPrefix extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("prefix", PermissionLevel.Owner, "Sets bot default prefix", bot, {usage: "<prefix>", group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let prefix: string = args.join(" ");

        let result: boolean = await bot.configs.botConfig.setDefaultPrefix(prefix);

        if(result) {
            await this.sendMessage(`Default prefix set to ${prefix} successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage("Default prefix was unable to be set.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetStatus extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("status", PermissionLevel.Owner, "Sets bot status", bot, {usage: "<online, away/idle, dnd, invis/offline>", group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        switch(args[0]) {
            case "online":
                await message.client.user.setStatus("online");
                break;
            case "away":
            case "idle":
                await message.client.user.setStatus("idle");
                break;
            case "dnd":
                await message.client.user.setStatus("dnd");
                break;
            case "invis":
            case "invisible":
            case "offline":
                await message.client.user.setStatus("invisible");
                break;
            default:
                return {sendHelp: true, command: this, message: message};
        }

        await this.sendMessage("Status updated successfully.", message.channel, bot);
        return {sendHelp: false, command: this, message: message};
    }
}

class SetActivity extends Command {
    private readonly STREAMING_URL: string = "https://twitch.tv/poisonedpanther";

    constructor(group: CommandGroup, bot: PantherBot) {
        super("activity", PermissionLevel.Owner, "Sets bot activity", bot, {usage: "<playing, streaming, listening, watching, clear> <activity string>", group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1 || (args.length < 2 && args[0] !== "clear")) {
            return {sendHelp: true, command: this, message: message};
        }

        let activityType: string = args.shift();
        let activityString: string = args.join(" ");
        let activityOptions: ActivityOptions;

        switch(activityType) {
            case "playing":
                activityOptions = {type: "PLAYING"};
                break;
            case "streaming":
                activityOptions = {type: "STREAMING", url: this.STREAMING_URL};
                break;
            case "listening":
                activityOptions = {type: "LISTENING"};
                break;
            case "watching":
                activityOptions = {type: "WATCHING"};
                break;
            case "clear":
                activityString = "";
                activityOptions = {};
                break;
            default:
                return {sendHelp: true, command: this, message: message};
        }

        await message.client.user.setActivity(activityString, activityOptions);
        await this.sendMessage("Activity updated successfully.", message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetErrorLogWebhook extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("errorwebhook", PermissionLevel.Owner, "Sets bot error log webhook", bot, {usage: "<webhook url>", group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let webhook: WebhookClient = await CommandUtils.parseWebhookUrl(args[0]);
        if(webhook === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        //Set webhook
        let result: boolean = await bot.configs.botConfig.setErrorWebhook(webhook);

        if(result) {
            await this.sendMessage("Log webhook set successfully.", message.channel, bot);
        }
        else {
            await this.sendMessage("Log webhook was unable to be set.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class GetInviteLink extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("getinvite", PermissionLevel.Owner, "Gets invite link (wow you're lazy)", bot, {group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let invite: string = await message.client.generateInvite(["ADD_REACTIONS", "CHANGE_NICKNAME", "BAN_MEMBERS", "KICK_MEMBERS", 
            "ATTACH_FILES", "CONNECT", "MANAGE_MESSAGES", "MANAGE_NICKNAMES", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "READ_MESSAGE_HISTORY",
            "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "SPEAK", "VIEW_CHANNEL"]);
        
        await this.sendMessage(`[Invite Link](${invite})`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}