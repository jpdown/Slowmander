import {Command, PermissionLevel, CommandResult} from './Command';
import {CommandGroup} from './CommandGroup';
import { PantherBot } from '../Bot';
import { CommandUtils } from '..//utils/CommandUtils';
import { PermissionsHelper } from '../utils/PermissionsHelper';

import {Message, GuildMember, MessageEmbed, Role, User, Collection, Snowflake, Permissions, Client, Guild} from 'discord.js';
import { ReactionPaginator } from '../utils/ReactionPaginator';

export class Roles extends CommandGroup {
    constructor(bot: PantherBot) {
        super("role", "Role management commands", bot, {aliases: ["roles", "r"]});

        this.registerSubCommands(bot);
    }

    protected registerSubCommands(bot: PantherBot): void {
        this.registerSubCommand(new CreateRole(this, bot));
        this.registerSubCommand(new RemoveRole(this, bot));
    }
}

class RolesHelper {
    public static async getRoleFromName(name: string, guild: Guild): Promise<Role> {
        //Make sure this role doesn't exist
        let guildRoles: Role[] = guild.roles.cache.array();
        let foundRole: Role;

        for(let role of guildRoles) {
            if(role.name.toLowerCase() === name.toLowerCase()) {
                foundRole = role
            }
        }

        return(foundRole);
    }
}

class CreateRole extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("create", PermissionLevel.Admin, "Creates a role", bot, {usage: "<role name>", group: group, runsInDm: false, aliases: ["c"], requiredPerm: Permissions.FLAGS.MANAGE_ROLES});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let newRoleName: string = args.join(" ");

        if(newRoleName.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        //Make sure we have perms
        if(!message.guild.me.hasPermission(Permissions.FLAGS.MANAGE_ROLES)) {
            await this.sendMessage("I do not have the Manage Roles permission.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Make sure this role doesn't exist
        if(await RolesHelper.getRoleFromName(newRoleName, message.guild)) {
            await this.sendMessage(`The role ${newRoleName} already exists.`, message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Create the role
        try {
            await message.guild.roles.create({data: {name: newRoleName, permissions: 0}, reason: `Created by ${message.author.username}#${message.author.discriminator} ID: ${message.author.id}`});
        }
        catch(err) {
            await this.logger.error(`Error creating role ${newRoleName} in guild ${message.guild.name}, guild ID ${message.guild.id}`, err);
            await this.sendMessage(`Unexpected error creating role ${newRoleName}.`, message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        await this.sendMessage(`Role ${newRoleName} created successfully.`, message.channel, bot);
        return {sendHelp: false, command: this, message: message};
    }
}

class RemoveRole extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("remove", PermissionLevel.Admin, "Removes a role", bot, {usage: "<role name>", group: group, runsInDm: false, aliases: ["r", "delete", "d"], requiredPerm: Permissions.FLAGS.MANAGE_ROLES});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let roleName: string = args.join(" ");

        if(roleName.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        //Make sure we have perms
        if(!message.guild.me.hasPermission(Permissions.FLAGS.MANAGE_ROLES)) {
            await this.sendMessage("I do not have the Manage Roles permission.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Make sure this role exists
        let roleToRemove: Role = await RolesHelper.getRoleFromName(roleName, message.guild);

        if(!roleToRemove) {
            await this.sendMessage(`The role ${roleName} doesn't exist.`, message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Delete the role
        try {
            await roleToRemove.delete(`Removed by ${message.author.username}#${message.author.discriminator} ID: ${message.author.id}`)
        }
        catch(err) {
            await this.logger.error(`Error removing role ${roleName} in guild ${message.guild.name}, guild ID ${message.guild.id}`, err);
            await this.sendMessage(`Unexpected error removing role ${roleName}.`, message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        await this.sendMessage(`Role ${roleName} removed successfully.`, message.channel, bot);
        return {sendHelp: false, command: this, message: message};
    }
}