import {Command, PermissionLevel, CommandResult} from 'commands/Command';
import {CommandGroup} from 'commands/CommandGroup'
import { PantherBot } from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';
import { LockdownConfigObject } from 'config/LockdownConfig';
import { ReactionPaginator } from 'utils/ReactionPaginator';

import {Message, MessageEmbed, Permissions, CategoryChannel, GuildChannel, Role, User, TextChannel, NewsChannel, Guild, Snowflake, ThreadChannel, GuildMember} from 'discord.js';

export class Lockdown extends Command {
    constructor(bot: PantherBot) {
        super("lockdown", PermissionLevel.Mod, "Locks down guild", bot, {usage: "[preset]", requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        try {
            await LockdownHelper.lockUnlock(bot, message, args, true);
        }
        catch(err) {
            await CommandUtils.sendMessage("Error locking server.", message.channel, bot);
            await this.logger.error(`Error locking guild ${message.guild!.name}`, err);
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
            await LockdownHelper.lockUnlock(bot, message, args, false);
        }
        catch(err) {
            await CommandUtils.sendMessage("Error unlocking server.", message.channel, bot);
            await this.logger.error(`Error unlocking guild ${message.guild!.name}`, err);
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
        let lockdownPresets: LockdownConfigObject[] = await bot.configs.lockdownConfig.getAllLockdownPresets(message.guild!.id);

        if(lockdownPresets.length < 1) {
            await CommandUtils.sendMessage("No presets found.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let presetNames: string[] = [];
        for(let preset of lockdownPresets) {
            presetNames.push(preset.name);
        }

        //Make paginator
        let paginator: ReactionPaginator = new ReactionPaginator(presetNames, 10, `Lockdown presets in guild ${message.guild!.name}`, message.channel, bot, this);
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

        let lockdownPreset: LockdownConfigObject = await bot.configs.lockdownConfig.getLockdownPreset(message.guild!.id, args[0]);

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
        super("set", PermissionLevel.Mod, "Sets lockdown preset channels and roles", bot, {usage: "<preset> <channel,...> <role,...> <grant/neutral>", requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group: group});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 4) {
            return {sendHelp: true, command: this, message: message};
        }

        //Parse channels
        let channelResult: {result: boolean, parsedIDs: string[]} = await this.parseChannels(args[1], message.guild!);
        if(!channelResult.result) {
            await CommandUtils.sendMessage("One or more of the channels given was incorrect.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Parse roles
        let rolesResult: {result: boolean, parsedIDs: string[]} = await this.parseRoles(args[2], message.guild!);
        if(!rolesResult.result) {
            await CommandUtils.sendMessage("One or more of the roles given was incorrect.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Parse grant/neutral
        let grant: boolean = false;
        if(args[3] === "grant") {
            grant = true;
        }

        //Make LockdownConfig
        let lockdownConfig: LockdownConfigObject = {
            guildID: message.guild!.id,
            channelIDs: channelResult.parsedIDs,
            roleIDs: rolesResult.parsedIDs,
            grant: grant,
            name: args[0]
        };

        //Try to save
        if(!await bot.configs.lockdownConfig.setLockdownPreset(lockdownConfig)) {
            await CommandUtils.sendMessage("Error saving lockdown preset.", message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage("Lockdown preset saved successfully.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }

    private async parseChannels(channels: string, guild: Guild): Promise<{result: boolean, parsedIDs: string[]}> {
        let splitChannels: string[] = channels.split(",");

        let result: boolean = true;
        let parsedIDs: string[] = [];
        for(let givenChannel of splitChannels) {
            let parsedID: string  | undefined= await CommandUtils.parseChannelID(givenChannel);
            //Make sure valid channel
            if(!parsedID || !guild.channels.resolve(parsedID)) {
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
            let parsedRole: Role | undefined = await CommandUtils.parseRole(givenRole, guild);
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
        if(await bot.configs.lockdownConfig.removeLockdownPreset(message.guild!.id, args[0])) {
            await CommandUtils.sendMessage(`Lockdown preset ${args[0]} removed successfully.`, message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage(`Error removing lockdown preset ${args[0]}, does it exist?`, message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class LockdownHelper {
    static readonly PERMISSION = Permissions.FLAGS.SEND_MESSAGES;
    static readonly LOCK_MESSAGE = "🔒 Channel has been locked down."
    static readonly UNLOCK_MESSAGE = "🔓 Channel has been unlocked."

    static async lockUnlock(bot: PantherBot, message: Message, args: string[], lock: boolean): Promise<boolean> {
        let preset: string = "default";

        if(args.length > 0) {
            preset = args[0];
        }

        //Try to get config
        let lockdownConfig: LockdownConfigObject = await bot.configs.lockdownConfig.getLockdownPreset(message.guild!.id, preset);
        if(!lockdownConfig) {
            await CommandUtils.sendMessage(`No lockdown config found, please make one with \`${await bot.commandManager.getPrefix(message.guild!.id)}managelockdown\`. The default preset is \`default\`.`, message.channel, bot);
            return false;
        }

        //Make lists
        let channels: GuildChannel[] = [];
        for(let channelId of lockdownConfig.channelIDs) {
            let parsedChannel: GuildChannel | ThreadChannel | null = message.guild!.channels.resolve(channelId);
            if(parsedChannel && (parsedChannel as GuildChannel)) {
                channels.push(<GuildChannel>parsedChannel);
            }
        }

        let roles: Role[] = [];
        for(let roleId of lockdownConfig.roleIDs) {
            let parsedRole: Role | null = message.guild!.roles.resolve(roleId);
            if(parsedRole) {
                roles.push(parsedRole);
            }
        }

        //Try to lockdown server
        let result: boolean = await LockdownHelper.updateChannelPerms(channels, roles, lock, lockdownConfig.grant, message.author, preset, bot);
        if(!result) {
            await CommandUtils.sendMessage(`Missing permissions to ${lock ? "lock" : "unlock"} server.`, message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage(`Server ${lock ? "locked" : "unlocked"} successfully.`, message.channel, bot);
        }

        return true;
    }

    static async updateChannelPerms(channels: GuildChannel[], roles: Role[], lock: boolean, grant: boolean, executor: User, preset: string, bot: PantherBot): Promise<boolean> {
        let reason: string = `${executor.username}#${executor.discriminator} performed ${preset} `;

        let zeroPerms: Permissions = new Permissions(0n);
        let neutralPerms: Permissions = zeroPerms;
        let grantedPerms: Permissions = zeroPerms;
        let revokedPerms: Permissions = zeroPerms;
        if(lock) {
            revokedPerms = new Permissions(this.PERMISSION);
            reason += "lockdown"
        }
        else {
            if(grant) {
                grantedPerms = new Permissions(this.PERMISSION);
            }
            else {
                neutralPerms = new Permissions(this.PERMISSION);
            }
            reason += "unlock"
        }

        //Get mod and admin role (if applicable)
        let guild: Guild = channels[0].guild;
        let modAndAdminRoles: Role[] = [];
        let modRoleId: Snowflake = await bot.configs.guildConfig.getModRole(guild.id);
        if(modRoleId) {
            let modRole: Role | null = guild.roles.resolve(modRoleId);
            if(modRole) { 
                modAndAdminRoles.push(modRole);
            }
        }
        let adminRoleId: Snowflake = await bot.configs.guildConfig.getAdminRole(guild.id);
        if(adminRoleId) {
            let adminRole: Role | null = guild.roles.resolve(adminRoleId);
            if(adminRole) { 
                modAndAdminRoles.push(adminRole);
            }
        }

        for(let channel of channels) {
            try {
                if(await CommandUtils.updateChannelPerms(channel, roles, [], grantedPerms, revokedPerms, neutralPerms, reason)) {
                    await CommandUtils.updateChannelPerms(channel, modAndAdminRoles, [channel.client.user!], new Permissions(this.PERMISSION), zeroPerms, zeroPerms, reason);
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
        if(!channel.isText() && channel.type !== "GUILD_CATEGORY") {
            return(false);
        }
        //If category, send in all children recursively
        if(channel.type === "GUILD_CATEGORY") {
            for(let childChannel of (<CategoryChannel>channel).children.values()) {
                if(childChannel.permissionsLocked) {
                    await this.trySendMessage(childChannel, lock, bot);
                }
            }
            return(true);
        }
        //Check perms
        let member: GuildMember = channel.guild.members.cache.get(bot.client.user!.id)!;
        if(!channel.permissionsFor(member).has(Permissions.FLAGS.SEND_MESSAGES)) {
            return(false);
        }
        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(<TextChannel | NewsChannel>channel, bot))
            .setDescription(lock ? this.LOCK_MESSAGE : this.UNLOCK_MESSAGE);

        try {
            await (<TextChannel | NewsChannel>channel).send({embeds: [embed]});
            return(true);
        }
        catch(err) {
            throw(err);
        }
    }
}