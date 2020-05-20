import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message, User, GuildMember, Role, ActivityOptions, WebhookClient, ColorResolvable, TextChannel, Channel, Permissions } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";
import { LogLevel } from "../Logger";

export class Set extends CommandGroup {
    constructor() {
        super("set", "Sets various bot parameters");

        this.registerSubCommands();
    }

    protected registerSubCommands(): void {
        this.registerSubCommand(new SetNickname(this));
        this.registerSubCommand(new SetGuildPrefix(this));
        this.registerSubCommand(new SetModRole(this));
        this.registerSubCommand(new SetAdminRole(this));
        this.registerSubCommand(new SetEventLogChannel(this));
    }
}

class SetNickname extends Command {
    constructor(group: CommandGroup) {
        super("nickname", PermissionLevel.Mod, "Sets bot or another member's nickname", {usage: "[member] <new nickname>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.MANAGE_NICKNAMES});
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

class SetGuildPrefix extends Command {
    constructor(group: CommandGroup) {
        super("prefix", PermissionLevel.Admin, "Sets prefix in guild", {usage: "<prefix>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let prefix: string = args.join(" ");

        await bot.commandManager.setGuildPrefix(message.guild.id, prefix);
        await this.sendMessage(`Prefix for guild ${message.guild.name} set to ${prefix} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetModRole extends Command {
    constructor(group: CommandGroup) {
        super("modrole", PermissionLevel.Admin, "Sets bot's mod role", {usage: "<role>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        await bot.configs.guildConfig.setModRole(message.guild.id, role.id);
        await this.sendMessage(`Mod role for guild ${message.guild.name} set to ${role.toString()} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetAdminRole extends Command {
    constructor(group: CommandGroup) {
        super("adminrole", PermissionLevel.Admin, "Sets bot's admin role", {usage: "<role>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        await bot.configs.guildConfig.setAdminRole(message.guild.id, role.id);
        await this.sendMessage(`Admin role for guild ${message.guild.name} set to ${role.toString()} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}

class SetEventLogChannel extends Command {
    constructor(group: CommandGroup) {
        super("eventlog", PermissionLevel.Owner, "Sets bot eventlog channel", {usage: "<channel>", runsInDm: false, group: group});
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
        await bot.configs.guildConfig.setEventlogChannel(message.guild.id, channel.id);

        await this.sendMessage(`Eventlog channel set to ${channel.toString()} for guild ${message.guild.name} successfully.`, message.channel, bot);

        return {sendHelp: false, command: this, message: message};
    }
}