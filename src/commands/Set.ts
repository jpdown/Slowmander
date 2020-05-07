import { CommandGroup } from "./CommandGroup";
import { Command } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message, User, GuildMember } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";

export class Set extends CommandGroup {
    constructor() {
        super("set", PermissionLevel.Owner, "Sets various bot parameters", "", true);

        this.registerSubCommands();
    }

    protected registerSubCommands(): void {
        this.registerSubCommand(new SetUsername(this));
        this.registerSubCommand(new SetAvatar(this));
        this.registerSubCommand(new SetNickname(this));
        this.registerSubCommand(new SetOwner(this));
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