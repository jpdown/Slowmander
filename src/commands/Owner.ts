import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message, User, GuildMember, Role, ActivityOptions, WebhookClient, ColorResolvable, TextChannel, Channel } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";
import { LogLevel } from "../Logger";

export class Owner extends CommandGroup {
    constructor() {
        super("owner", PermissionLevel.Owner, "Owner commands (you know this already)");

        this.registerSubCommands();
    }

    protected registerSubCommands(): void {
        this.registerSubCommand(new SetUsername(this));
        this.registerSubCommand(new SetAvatar(this));
        this.registerSubCommand(new AddOwner(this));
        this.registerSubCommand(new RemoveOwner(this));
        this.registerSubCommand(new SetDefaultPrefix(this));
        this.registerSubCommand(new SetStatus(this));
        this.registerSubCommand(new SetActivity(this));
        this.registerSubCommand(new SetErrorLogWebhook(this));
    }
}

class SetUsername extends Command {
    constructor(group: CommandGroup) {
        super("name", PermissionLevel.Owner, "Sets bot username.", {usage: "<username>", group: group, longDesc: "Minimum username length is 2 characters."});
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
            await bot.logger.log(LogLevel.ERROR, "SetUsername:run Error changing username.", err);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetAvatar extends Command {
    constructor(group: CommandGroup) {
        super("avatar", PermissionLevel.Owner, "Sets bot avatar", {usage: "<image url>", group: group});
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
            await bot.logger.log(LogLevel.ERROR, "SetAvatar:run Error changing avatar.", err);
        }
        return {sendHelp: false, command: this, message: message};
    }
}

class AddOwner extends Command {
    constructor(group: CommandGroup) {
        super("addowner", PermissionLevel.Owner, "Adds a bot owner", {usage: "<owner>", group: group});
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
    constructor(group: CommandGroup) {
        super("removeowner", PermissionLevel.Owner, "Removes a bot owner", {usage: "<owner>", group: group});
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
    constructor(group: CommandGroup) {
        super("prefix", PermissionLevel.Owner, "Sets bot default prefix", {usage: "<prefix>", group: group});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let prefix: string = args.join(" ");

        await bot.configs.botConfig.setDefaultPrefix(prefix);
        await this.sendMessage(`Prefix set to ${prefix} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetStatus extends Command {
    constructor(group: CommandGroup) {
        super("status", PermissionLevel.Owner, "Sets bot status", {usage: "<online, away/idle, dnd, invis/offline>", group: group});
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
    private readonly STREAMING_URL: string = "https://twitch.tv/jpdown";

    constructor(group: CommandGroup) {
        super("activity", PermissionLevel.Owner, "Sets bot activity", {usage: "<playing, streaming, listening, watching, clear> <activity string>", group: group});
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
    constructor(group: CommandGroup) {
        super("errorwebhook", PermissionLevel.Owner, "Sets bot error log webhook", {usage: "<webhook url>", group: group});
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
        await bot.configs.botConfig.setErrorWebhook(webhook);

        await this.sendMessage("Log webhook set successfully.", message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}