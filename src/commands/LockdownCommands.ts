import {Command, PermissionLevel, CommandResult} from './Command';
import {CommandGroup} from './CommandGroup'
import { PantherBot } from '../Bot';

import {Message, MessageEmbed, Permissions, CategoryChannel, GuildChannel, Role, User, TextChannel, NewsChannel, Guild} from 'discord.js';
import { CommandUtils } from '../utils/CommandUtils';
import { LockdownConfigObject } from '../config/LockdownConfig';
import { ReactionPaginator } from '../utils/ReactionPaginator';

export class Lockdown extends Command {
    constructor(bot: PantherBot) {
        super("lockdown", PermissionLevel.Mod, "Locks down guild", bot, {usage: "[preset]", requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        try {
            await LockdownHelper.lockUnlock(bot, message, args, this, true);
        }
        catch(err) {
            await this.sendMessage("Error locking server.", message.channel, bot);
            await this.logger.error(`Error locking guild ${message.guild.name}`, err);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

export class Unlock extends Command {
    constructor(bot: PantherBot) {
        super("unlock", PermissionLevel.Mod, "Unlocks guild", bot, {usage: "[preset]", requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        try {
            await LockdownHelper.lockUnlock(bot, message, args, this, false);
        }
        catch(err) {
            await this.sendMessage("Error unlocking server.", message.channel, bot);
            await this.logger.error(`Error unlocking guild ${message.guild.name}`, err);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

export class ManageLockdown extends CommandGroup {
    constructor(bot: PantherBot) {
        super("managelockdown", "Manages lockdown presets", bot, {runsInDm: false});

        this.registerSubCommands(bot);
    }

    protected registerSubCommands(bot: PantherBot): void {
        this.registerSubCommand(new ManageLockdownList(this, bot));
        this.registerSubCommand(new ManageLockdownInfo(this, bot));
        this.registerSubCommand(new ManageLockdownSet(this, bot));
        this.registerSubCommand(new ManageLockdownRemove(this, bot));
    }
}

class ManageLockdownList extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("list", PermissionLevel.Mod, "Lists lockdown presets", bot, {requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group: group});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let lockdownPresets: LockdownConfigObject[] = await bot.configs.lockdownConfig.getAllLockdownPresets(message.guild.id);

        if(lockdownPresets.length < 1) {
            await this.sendMessage("No presets found.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let presetNames: string[] = [];
        for(let preset of lockdownPresets) {
            presetNames.push(preset.name);
        }

        //Make paginator
        let paginator: ReactionPaginator = new ReactionPaginator(presetNames, 10, `Lockdown presets in guild ${message.guild.name}`, message.channel, bot, this);
        let paginatedMessage: Message = await paginator.postMessage();

        return {sendHelp: false, command: this, message: message};
    }
}

class ManageLockdownInfo extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("info", PermissionLevel.Mod, "Gives information on specific lockdown preset", bot, {usage: "<preset>", requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group: group});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let lockdownPreset: LockdownConfigObject = await bot.configs.lockdownConfig.getLockdownPreset(message.guild.id, args[0]);

        if(!lockdownPreset) {
            return {sendHelp: true, command: this, message: message};
        }

        //Make lists
        let channelList: string[] = [];
        for(let channel of lockdownPreset.channelIDs) {
            channelList.push(`<#${channel}>`);
        }
        let roleList: string[] = [];
        for(let role of lockdownPreset.roleIDs) {
            roleList.push(`<@&${role}>`);
        }

        //Make paginators
        let channelPaginator: ReactionPaginator = new ReactionPaginator(channelList, 10, `Channels in lockdown preset ${lockdownPreset.name}`, message.channel, bot, this);
        let channelMessage: Message = await channelPaginator.postMessage();
        let rolePaginator: ReactionPaginator = new ReactionPaginator(roleList, 10, `Roles in lockdown preset ${lockdownPreset.name}`, message.channel, bot, this);
        let roleMessage: Message = await rolePaginator.postMessage();

        return {sendHelp: false, command: this, message: message};
    }
}

class ManageLockdownSet extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("set", PermissionLevel.Mod, "Sets lockdown preset channels and roles", bot, {usage: "<preset> <channel,...> <role,...>", requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group: group});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 3) {
            return {sendHelp: true, command: this, message: message};
        }

        //Parse channels
        let channelResult: {result: boolean, parsedIDs: string[]} = await this.parseChannels(args[1], message.guild);
        if(!channelResult.result) {
            await this.sendMessage("One or more of the channels given was incorrect.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Parse roles
        let rolesResult: {result: boolean, parsedIDs: string[]} = await this.parseRoles(args[2], message.guild);
        if(!rolesResult.result) {
            await this.sendMessage("One or more of the roles given was incorrect.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Make LockdownConfig
        let lockdownConfig: LockdownConfigObject = {
            guildID: message.guild.id,
            channelIDs: channelResult.parsedIDs,
            roleIDs: rolesResult.parsedIDs,
            name: args[0]
        };

        //Try to save
        if(!await bot.configs.lockdownConfig.setLockdownPreset(lockdownConfig)) {
            await this.sendMessage("Error saving lockdown preset.", message.channel, bot);
        }
        else {
            await this.sendMessage("Lockdown preset saved successfully.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }

    private async parseChannels(channels: string, guild: Guild): Promise<{result: boolean, parsedIDs: string[]}> {
        let splitChannels: string[] = channels.split(",");

        let result: boolean = true;
        let parsedIDs: string[] = [];
        for(let givenChannel of splitChannels) {
            let parsedID: string = await CommandUtils.parseChannelID(givenChannel);
            //Make sure valid channel
            if(!guild.channels.resolve(parsedID)) {
                result = false;
                break;
            }

            parsedIDs.push(parsedID);
        }

        return({result: result, parsedIDs: parsedIDs});
    }

    private async parseRoles(roles: string, guild: Guild): Promise<{result: boolean, parsedIDs: string[]}> {
        let splitRoles: string[] = roles.split(",");

        let result: boolean = true;
        let parsedIDs: string[] = [];
        for(let givenRole of splitRoles) {
            let parsedRole: Role = await CommandUtils.parseRole(givenRole, guild);
            //Make sure valid role
            if(!parsedRole) {
                result = false;
                break;
            }

            parsedIDs.push(parsedRole.id);
        }

        return({result: result, parsedIDs: parsedIDs});
    }
}

class ManageLockdownRemove extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("remove", PermissionLevel.Mod, "Removes given lockdown preset", bot, {usage: "<preset>", requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group: group, aliases: ["rem", "del", "delete"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        //Try to delete
        if(await bot.configs.lockdownConfig.removeLockdownPreset(message.guild.id, args[0])) {
            await this.sendMessage(`Lockdown preset ${args[0]} removed successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage(`Error removing lockdown preset ${args[0]}, does it exist?`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class LockdownHelper {
    static readonly PERMISSION = Permissions.FLAGS.SEND_MESSAGES;
    static readonly LOCK_MESSAGE = "🔒 Channel has been locked down."
    static readonly UNLOCK_MESSAGE = "🔓 Channel has been unlocked."

    static async lockUnlock(bot: PantherBot, message: Message, args: string[], command: Command, lock: boolean): Promise<boolean> {
        let preset: string = "default";

        if(args.length > 0) {
            preset = args[0];
        }

        //Try to get config
        let lockdownConfig: LockdownConfigObject = await bot.configs.lockdownConfig.getLockdownPreset(message.guild.id, preset);
        if(!lockdownConfig) {
            await command.sendMessage(`No lockdown config found, please make one with \`${await bot.commandManager.getPrefix(message.guild.id)}managelockdown\`. The default preset is \`default\`.`, message.channel, bot);
            return false;
        }

        //Make lists
        let channels: GuildChannel[] = [];
        for(let channelId of lockdownConfig.channelIDs) {
            let parsedGuildChannel: GuildChannel = message.guild.channels.resolve(channelId);
            if(parsedGuildChannel) {
                channels.push(parsedGuildChannel);
            }
        }

        let roles: Role[] = [];
        for(let roleId of lockdownConfig.roleIDs) {
            let parsedRole: Role = message.guild.roles.resolve(roleId);
            if(parsedRole) {
                roles.push(parsedRole);
            }
        }

        //Try to lockdown server
        let result: boolean = await LockdownHelper.updateChannelPerms(channels, roles, lock, message.author, preset, bot);
        if(!result) {
            await command.sendMessage(`Missing permissions to ${lock ? "lock" : "unlock"} server.`, message.channel, bot);
        }
        else {
            await command.sendMessage(`Server ${lock ? "locked" : "unlocked"} successfully.`, message.channel, bot);
        }

        return true;
    }

    static async updateChannelPerms(channels: GuildChannel[], roles: Role[], lock: boolean, executor: User, preset: string, bot: PantherBot): Promise<boolean> {
        let reason: string = `${executor.username}#${executor.discriminator} performed ${preset} `;

        let neutralPerms: Permissions = new Permissions(0);
        let grantedPerms: Permissions = new Permissions(0);
        let revokedPerms: Permissions = new Permissions(0);
        if(lock) {
            revokedPerms = new Permissions(this.PERMISSION);
            reason += "lockdown"
        }
        else {
            grantedPerms = new Permissions(this.PERMISSION);
            reason += "unlock"
        }

        for(let channel of channels) {
            try {
                console.log(channel.name);
                if(await CommandUtils.updateChannelPerms(channel, roles, [], grantedPerms, revokedPerms, neutralPerms, reason)) {
                    await CommandUtils.updateChannelPerms(channel, [], [channel.client.user], new Permissions(this.PERMISSION), neutralPerms, neutralPerms, reason);
                    await this.trySendMessage(channel, lock, bot);
                }
                else {
                    return(false);
                }
            }
            catch(err) {
                throw(err);
            }
        }
        return(true)
    }

    static async trySendMessage(channel: GuildChannel, lock: boolean, bot: PantherBot): Promise<boolean> {
        //if not a channel we can send messages in
        if(channel.type === "voice" || channel.type === "store") {
            return(false);
        }
        //If category, send in all children recursively
        if(channel.type === "category") {
            for(let childChannel of (<CategoryChannel>channel).children.values()) {
                if(childChannel.permissionsLocked) {
                    await this.trySendMessage(childChannel, lock, bot);
                }
            }
            return(true);
        }
        //Check perms
        if(!channel.permissionsFor(bot.client.user).has(Permissions.FLAGS.SEND_MESSAGES)) {
            return(false);
        }
        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(<TextChannel | NewsChannel>channel, bot))
            .setDescription(lock ? this.LOCK_MESSAGE : this.UNLOCK_MESSAGE);

        try {
            await (<TextChannel | NewsChannel>channel).send(embed);
            return(true);
        }
        catch(err) {
            throw(err);
        }
    }
}