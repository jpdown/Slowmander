import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message, User, GuildMember, Role, ActivityOptions } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";

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
            await this.sendMessage("Username changed successfully.", message.channel);
        }
        catch(err) {
            await this.sendMessage("Error changing username, rate limit?", message.channel);
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
            await this.sendMessage("Avatar changed successfully.", message.channel);
        }
        catch(err) {
            await this.sendMessage("Error changing avatar, check console for details.", message.channel);
            console.log("Error changing avatar", err);
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
            await this.sendMessage(`Nickname for ${member.toString()} changed successfully.`, message.channel);
        }
        catch(err) {
            await this.sendMessage("Error changing nickname, missing perms? Check console for details.", message.channel);
            console.log("Error changing nickname, missing perms?", err);
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

        await bot.config.setOwner(user.id);
        await this.sendMessage(`Owner set to ${user.toString()} successfully.`, message.channel);

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

        await bot.config.setPrefix(prefix);
        await this.sendMessage(`Prefix set to ${prefix} successfully.`, message.channel);

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

        await bot.config.setVipRole(role.id);
        await this.sendMessage(`VIP role set to ${role.toString()} successfully.`, message.channel);

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

        await bot.config.setModRole(role.id);
        await this.sendMessage(`Mod role set to ${role.toString()} successfully.`, message.channel);

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

        await bot.config.setAdminRole(role.id);
        await this.sendMessage(`Admin role set to ${role.toString()} successfully.`, message.channel);

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

        await this.sendMessage("Status updated successfully.", message.channel);
        return {sendHelp: false, command: this, message: message};
    }
}

class SetActivity extends Command {
    private readonly STREAMING_URL: string = "https://twitch.tv/jpdown";

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
        await this.sendMessage("Activity updated successfully.", message.channel);

        return {sendHelp: false, command: this, message: message};
    }
}