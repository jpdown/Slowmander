import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message, GuildMember, Role, TextChannel, Channel, Permissions } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";

export class Set extends CommandGroup {
    constructor(bot: PantherBot) {
        super("set", "Sets various bot parameters", bot);

        this.registerSubCommands(bot);
    }

    protected registerSubCommands(bot: PantherBot): void {
        this.registerSubCommand(new SetNickname(this, bot));
        this.registerSubCommand(new SetGuildPrefix(this, bot));
        this.registerSubCommand(new SetVipRole(this, bot));
        this.registerSubCommand(new SetModRole(this, bot));
        this.registerSubCommand(new SetAdminRole(this, bot));
        this.registerSubCommand(new SetEventLogChannel(this, bot));
        this.registerSubCommand(new SetModErrorLogChannel(this, bot));
    }
}

class SetNickname extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("nickname", PermissionLevel.Mod, "Sets bot or another member's nickname", bot, {usage: "[member] <new nickname>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.MANAGE_NICKNAMES, aliases: ["nick"]});
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

        //Check if we can change nickname
        if(!await this.checkPerms(member, message, bot)) {
            return {sendHelp: false, command: this, message: message};
        }

        newNickname = args.join(" ");

        try {
            await member.setNickname(newNickname);
            await CommandUtils.sendMessage(`Nickname for ${member.toString()} changed successfully.`, message.channel, bot);
        }
        catch(err) {
            await CommandUtils.sendMessage("Error changing nickname, missing perms?", message.channel, bot);
            await this.logger.error("Error changing nickname, missing perms?", err);
        }
        return {sendHelp: false, command: this, message: message};
    }

    private async checkPerms(member: GuildMember, message: Message, bot: PantherBot): Promise<boolean> {
        if(member.id === member.client.user.id && !member.hasPermission(Permissions.FLAGS.CHANGE_NICKNAME)) {
            await CommandUtils.sendMessage("Setting nickname failed: I'm missing permission to change my own nickname.", message.channel, bot);
            return(false);
        }
        else if(member.id !== member.client.user.id && !message.guild.me.hasPermission(Permissions.FLAGS.MANAGE_NICKNAMES)) {
            await CommandUtils.sendMessage("Setting nickname failed: I'm missing permission to change other nicknames.", message.channel, bot);
            return(false);
        }
        else if(member.id !== member.client.user.id && message.guild.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
            await CommandUtils.sendMessage("Setting nickname failed: My top role is below the member's top role.", message.channel, bot);
            return(false);
        }
        else if(member.id !== member.client.user.id && member.id === member.guild.ownerID) {
            await CommandUtils.sendMessage("Setting nickname failed: I cannot change the nickname of the server owner.", message.channel, bot);
            return(false);
        }

        return(true);
    }
}

class SetGuildPrefix extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("prefix", PermissionLevel.Admin, "Sets prefix in guild", bot, {usage: "<prefix>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let prefix: string = args.join(" ");

        let result: boolean = await bot.commandManager.setGuildPrefix(message.guild.id, prefix);

        if(result) {
            await CommandUtils.sendMessage(`Prefix for guild ${message.guild.name} set to ${prefix} successfully.`, message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage(`Prefix was unable to be set for guild ${message.guild.name}.`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetVipRole extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("viprole", PermissionLevel.Admin, "Sets bot's vip role", bot, {usage: "<role>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        let result: boolean = await bot.configs.guildConfig.setVipRole(message.guild.id, role.id);

        if(result) {
            await CommandUtils.sendMessage(`VIP role for guild ${message.guild.name} set to ${role.toString()} successfully.`, message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage(`VIP role was unable to be set for guild ${message.guild.name}.`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetModRole extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("modrole", PermissionLevel.Admin, "Sets bot's mod role", bot, {usage: "<role>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        let result: boolean = await bot.configs.guildConfig.setModRole(message.guild.id, role.id);

        if(result) {
            await CommandUtils.sendMessage(`Mod role for guild ${message.guild.name} set to ${role.toString()} successfully.`, message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage(`Mod role was unable to be set for guild ${message.guild.name}.`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetAdminRole extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("adminrole", PermissionLevel.Admin, "Sets bot's admin role", bot, {usage: "<role>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        let result: boolean = await bot.configs.guildConfig.setAdminRole(message.guild.id, role.id);

        if(result) {
            await CommandUtils.sendMessage(`Admin role for guild ${message.guild.name} set to ${role.toString()} successfully.`, message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage(`Admin role was unable to be set for guild ${message.guild.name}.`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetEventLogChannel extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("eventlog", PermissionLevel.Admin, "Sets bot eventlog channel", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
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
        let result: boolean = await bot.eventLogger.setEventlogChannel(message.guild.id, channel.id);


        if(result) {
            await CommandUtils.sendMessage(`Eventlog channel set to ${channel.toString()} for guild ${message.guild.name} successfully.`, message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage(`Eventlog channel was unable to be set for guild ${message.guild.name}.`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetModErrorLogChannel extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("moderror", PermissionLevel.Admin, "Sets mod error log channel", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
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
        let result: boolean = await bot.configs.guildConfig.setModErrorChannel(message.guild.id, channel.id);


        if(result) {
            await this.sendMessage(`Mod error log channel set to ${channel.toString()} for guild ${message.guild.name} successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage(`Mod error log channel was unable to be set for guild ${message.guild.name}.`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}