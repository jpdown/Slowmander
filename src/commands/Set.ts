import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message, User, GuildMember, Role, ActivityOptions, WebhookClient, ColorResolvable, TextChannel, Channel } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";
import { LogLevel } from "../Logger";

export class Set extends CommandGroup {
    constructor() {
        super("set", PermissionLevel.Owner, "Sets various bot parameters", true);

        this.registerSubCommands();
    }

    protected registerSubCommands(): void {
        this.registerSubCommand(new SetUsername(this));
        this.registerSubCommand(new SetAvatar(this));
        this.registerSubCommand(new SetNickname(this));
        this.registerSubCommand(new SetOwner(this));
        this.registerSubCommand(new SetPrefix(this));
        this.registerSubCommand(new SetVipRole(this));
        this.registerSubCommand(new SetModRole(this));
        this.registerSubCommand(new SetAdminRole(this));
        this.registerSubCommand(new SetStatus(this));
        this.registerSubCommand(new SetActivity(this));
        this.registerSubCommand(new SetErrorLogWebhook(this));
        this.registerSubCommand(new SetEventLogChannel(this));
        this.registerSubCommand(new SetDefaultColor(this));
    }
}

class SetUsername extends Command {
    constructor(group: CommandGroup) {
        super("name", PermissionLevel.Owner, "Sets bot username.", "<username>", true, group, "Minimum username length is 2 characters.");
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
        super("avatar", PermissionLevel.Owner, "Sets bot avatar", "<image url>", true, group);
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

class SetNickname extends Command {
    constructor(group: CommandGroup) {
        super("nickname", PermissionLevel.Owner, "Sets bot or another member's nickname", "[member] <new nickname>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let member: GuildMember;
        let newNickname: string;
        if(args.length > 0) {
            member = await CommandUtils.parseMember(args[0], message.guild);
        }

        if(member !== undefined) {
            args.shift();
        }
        else {
            member = message.guild.me;
        }

        newNickname = args.join(" ");

        try {
            await member.setNickname(newNickname);
            await this.sendMessage(`Nickname for ${member.toString()} changed successfully.`, message.channel, bot);
        }
        catch(err) {
            await this.sendMessage("Error changing nickname, missing perms? Check log for details.", message.channel, bot);
            await bot.logger.log(LogLevel.ERROR, "SetNickname:run Error changing nickname, missing perms?", err);
        }
        return {sendHelp: false, command: this, message: message};
    }
}

class SetOwner extends Command {
    constructor(group: CommandGroup) {
        super("owner", PermissionLevel.Owner, "Sets bot owner", "<owner>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let user: User = await CommandUtils.parseUser(args.join(" "), message.client);

        if(user === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        bot.config.owner = user.id;
        await this.sendMessage(`Owner set to ${user.toString()} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetPrefix extends Command {
    constructor(group: CommandGroup) {
        super("prefix", PermissionLevel.Owner, "Sets bot prefix", "<prefix>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let prefix: string = args.join(" ");

        bot.config.prefix = prefix;
        await this.sendMessage(`Prefix set to ${prefix} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetVipRole extends Command {
    constructor(group: CommandGroup) {
        super("viprole", PermissionLevel.Owner, "Sets bot's VIP role", "<role>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        bot.config.vipRole = role.id;
        await this.sendMessage(`VIP role set to ${role.toString()} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetModRole extends Command {
    constructor(group: CommandGroup) {
        super("modrole", PermissionLevel.Owner, "Sets bot's mod role", "<role>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        bot.config.modRole = role.id;
        await this.sendMessage(`Mod role set to ${role.toString()} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetAdminRole extends Command {
    constructor(group: CommandGroup) {
        super("adminrole", PermissionLevel.Owner, "Sets bot's admin role", "<role>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        bot.config.adminRole = role.id;
        await this.sendMessage(`Admin role set to ${role.toString()} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetStatus extends Command {
    constructor(group: CommandGroup) {
        super("status", PermissionLevel.Owner, "Sets bot status", "<online, away/idle, dnd, invis/offline>", true, group);
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

    constructor(group: CommandGroup) {
        super("activity", PermissionLevel.Owner, "Sets bot activity", "<playing, streaming, listening, watching, clear> <activity string>", true, group);
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
        super("errorwebhook", PermissionLevel.Owner, "Sets bot error log webhook", "<webhook url>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let webhook: WebhookClient = await CommandUtils.parseWebhookUrl(args[0]);
        if(webhook === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        //Set id and token
        bot.config.errorWebhookId = webhook.id;
        bot.config.errorWebhookToken = webhook.token;

        await this.sendMessage("Log webhook set successfully.", message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetEventLogChannel extends Command {
    constructor(group: CommandGroup) {
        super("eventlog", PermissionLevel.Owner, "Sets bot eventlog channel", "<channel>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let channel: Channel = await CommandUtils.parseChannel(args.join(" "), message.client);

        if(channel === undefined || !(channel as TextChannel)) {
            return {sendHelp: true, command: this, message: message};
        }

        //Set channel
        bot.config.eventlogChannelId = channel.id;

        await this.sendMessage("Eventlog channel set successfully.", message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}


class SetDefaultColor extends Command {
    constructor(group: CommandGroup) {
        super("defaultcolor", PermissionLevel.Owner, "Sets bot default color", "<#hexcolor>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1 || !(args.join(" ") as ColorResolvable)) {
            return {sendHelp: true, command: this, message: message};
        }

        bot.config.defaultColor = args.join(" ");
        await this.sendMessage("Default color set successfully.", message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}