import { CommandGroup } from "./CommandGroup";
import { Command } from "./Command";
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
        super("name", PermissionLevel.Owner, "Sets bot username", "<username>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        let newUsername: string = args.join(" ");

        if(newUsername.length < 2) {
            await this.sendMessage("Username too short.", message.channel);
            return;
        }

        try {
            await message.client.user.setUsername(newUsername);
            await this.sendMessage("Username changed successfully.", message.channel);
        }
        catch(err) {
            await this.sendMessage("Error changing username, rate limit?", message.channel);
        }
    }
}

class SetAvatar extends Command {
    constructor(group: CommandGroup) {
        super("avatar", PermissionLevel.Owner, "Sets bot avatar", "<image url>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        if(args.length < 1) {
            await this.sendMessage("you gotta give me an image dumbo", message.channel);
            return;
        }
        try {
            await message.client.user.setAvatar(args[0]);
            await this.sendMessage("Avatar changed successfully.", message.channel);
        }
        catch(err) {
            await this.sendMessage("Error changing avatar, check console for details.", message.channel);
            console.log("Error changing avatar", err);
        }

    }
}

class SetNickname extends Command {
    constructor(group: CommandGroup) {
        super("nickname", PermissionLevel.Owner, "Sets bot or another member's nickname", "[member] <new nickname>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
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

    }
}

class SetOwner extends Command {
    constructor(group: CommandGroup) {
        super("owner", PermissionLevel.Owner, "Sets bot owner", "<owner>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        if(args.length < 1) {
            await this.sendMessage("you gotta give me a user dumbo", message.channel);
            return;
        }

        let user: User = await CommandUtils.parseUser(args.join(" "), message.client);

        if(user === undefined) {
            await this.sendMessage("you gotta give me a user dumbo", message.channel);
            return;
        }

        await bot.config.setOwner(user.id);
        await this.sendMessage(`Owner set to ${user.toString()} successfully.`, message.channel);
    }
}

class SetPrefix extends Command {
    constructor(group: CommandGroup) {
        super("prefix", PermissionLevel.Owner, "Sets bot prefix", "<prefix>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        if(args.length < 1) {
            await this.sendMessage("you gotta give me a prefix dumbo", message.channel);
            return;
        }

        let prefix: string = args.join(" ");

        await bot.config.setPrefix(prefix);
        await this.sendMessage(`Prefix set to ${prefix} successfully.`, message.channel);
    }
}

class SetVipRole extends Command {
    constructor(group: CommandGroup) {
        super("viprole", PermissionLevel.Owner, "Sets bot's VIP role", "<role>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        if(args.length < 1) {
            await this.sendMessage("you gotta give me a role dumbo", message.channel);
            return;
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            await this.sendMessage("you gotta give me a role dumbo", message.channel);
            return;
        }

        await bot.config.setVipRole(role.id);
        await this.sendMessage(`VIP role set to ${role.toString()} successfully.`, message.channel);
    }
}

class SetModRole extends Command {
    constructor(group: CommandGroup) {
        super("modrole", PermissionLevel.Owner, "Sets bot's mod role", "<role>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        if(args.length < 1) {
            await this.sendMessage("you gotta give me a role dumbo", message.channel);
            return;
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            await this.sendMessage("you gotta give me a role dumbo", message.channel);
            return;
        }

        await bot.config.setModRole(role.id);
        await this.sendMessage(`Mod role set to ${role.toString()} successfully.`, message.channel);
    }
}

class SetAdminRole extends Command {
    constructor(group: CommandGroup) {
        super("adminrole", PermissionLevel.Owner, "Sets bot's admin role", "<role>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        if(args.length < 1) {
            await this.sendMessage("you gotta give me a role dumbo", message.channel);
            return;
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            await this.sendMessage("you gotta give me a role dumbo", message.channel);
            return;
        }

        await bot.config.setAdminRole(role.id);
        await this.sendMessage(`Admin role set to ${role.toString()} successfully.`, message.channel);
    }
}

class SetStatus extends Command {
    constructor(group: CommandGroup) {
        super("status", PermissionLevel.Owner, "Sets bot status", "<online, away/idle, dnd, invis/offline>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        if(args.length < 1) {
            await this.sendMessage("you gotta give me a status dumbo", message.channel);
            return;
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
                await this.sendMessage("you gotta give me a valid status dumbo", message.channel);
                return;
        }

        await this.sendMessage("Status updated successfully.", message.channel);
    }
}

class SetActivity extends Command {
    private readonly STREAMING_URL: string = "https://twitch.tv/poisonedpanther";

    constructor(group: CommandGroup) {
        super("activity", PermissionLevel.Owner, "Sets bot activity", "<playing, streaming, listening, watching, clear> <activity string>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        if(args.length < 1 || (args.length < 2 && args[0] !== "clear")) {
            await this.sendMessage("you gotta give me an acitivity dumbo", message.channel);
            return;
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
                await this.sendMessage("you gotta give me a valid activity dumbo", message.channel);
                return;
        }

        await message.client.user.setActivity(activityString, activityOptions);
        await this.sendMessage("Activity updated successfully.", message.channel);
    }
}