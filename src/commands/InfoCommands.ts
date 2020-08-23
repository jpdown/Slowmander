import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';
import { CommandUtils } from '..//utils/CommandUtils';
import { PermissionsHelper } from '../utils/PermissionsHelper';

import {Message, GuildMember, MessageEmbed, Role, User, Collection, Snowflake, Permissions, Client, Guild} from 'discord.js';
import { ReactionPaginator } from '../utils/ReactionPaginator';

import * as process from "process";
import * as os from "os";

export class Whois extends Command {
    constructor(bot: PantherBot) {
        super("whois", PermissionLevel.Everyone, "Gets information on a member", bot, {usage: "[member]", runsInDm: false, aliases: ["who"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let member: GuildMember = message.member;

        if(args.length > 0) {
            let parsedMember: GuildMember = await CommandUtils.parseMember(args.join(" "), message.guild);
            if(parsedMember) {
                member = parsedMember;
            }
        }

        //Get member avatar
        let avatarUrl: string = member.user.displayAvatarURL({format: "png", dynamic: true, size: 4096});

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setAuthor(member.user.username + "#" + member.user.discriminator, avatarUrl, avatarUrl)
            .setThumbnail(avatarUrl)
            .setColor(member.displayColor)
            .setDescription(member.toString())
            .setFooter(`ID: ${member.id}`, avatarUrl)
            .setTimestamp(Date.now());
        
        //If we have a nickname, add field
        if(member.nickname) {
            embed.addField("Nickname", member.nickname, false);
        }

        //Time related portions
        embed.addField("Registered", member.user.createdAt.toUTCString(), true);
        embed.addField("Joined", member.joinedAt.toUTCString(), true);
        if(member.premiumSince) {
            embed.addField("Boosted", member.premiumSince.toUTCString(), true);
        }

        //Join pos
        embed.addField("Join Position", await this.getJoinPos(member), false);

        //Roles list
        let rolesList: Collection<Snowflake, Role> = member.roles.cache.clone();
        rolesList.sort((a, b) => b.position - a.position);
        rolesList.delete(message.guild.roles.everyone.id);
        if(rolesList.size > 0) {
            embed.addField(`Roles (${rolesList.size})`, rolesList.array().join(", "), false);
        }

        //Bot permission
        let permLevel: PermissionLevel = await PermissionsHelper.getMemberPermLevel(member, bot);
        if(permLevel > PermissionLevel.Everyone) {
            embed.addField("Bot Permission", PermissionLevel[permLevel], false);
        }

        //Send
        await message.channel.send(embed);

        return {sendHelp: false, command: this, message: message};
    }

    private async getJoinPos(member: GuildMember): Promise<number> {
        //Get all members
        let allMembers: Collection<Snowflake, GuildMember> = await member.guild.members.fetch();
        //Iterate, keeping track of join time
        let joinPos: number = 1;
        for(let [currSnowflake, currMember] of allMembers) {
            if(currMember.joinedTimestamp < member.joinedTimestamp) {
                joinPos++;
            }
        }

        return(joinPos);
    }
}

export class Roles extends Command {
    constructor(bot: PantherBot) {
        super("roles", PermissionLevel.Mod, "Gets list of roles", bot, {runsInDm: false, requiredPerm: Permissions.FLAGS.MANAGE_ROLES, aliases: ["rolelist"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        //Roles list
        await message.guild.roles.fetch(); //Fetch all roles (just to be sure)
        let rolesList: Collection<Snowflake, Role> = message.guild.roles.cache.clone();
        rolesList.sort((a, b) => b.position - a.position);
        rolesList.delete(message.guild.roles.everyone.id);

        //List of strings
        let stringList: string[] = [];
        for(let role of rolesList.array()) {
            stringList.push(role.toString() + " - " + role.members.size + " members.");
        }

        //Make paginator
        let paginator: ReactionPaginator = new ReactionPaginator(stringList, 10, 
            "Roles in " + message.guild.name, message.channel, bot, this);

        let paginatedMessage = await paginator.postMessage();

        return {sendHelp: false, command: this, message: message};
    }
}

export class Members extends Command {
    constructor(bot: PantherBot) {
        super("members", PermissionLevel.Mod, "Gets list of members for given role", bot, {usage: "<role>", runsInDm: false, requiredPerm: Permissions.FLAGS.MANAGE_ROLES, aliases: ["rolemembers"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        //Get role
        let role: Role = await CommandUtils.parseRole(args.join(" "), message.guild);

        if(role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        let memberList: Collection<Snowflake, GuildMember> = role.members;

        //List of strings
        let stringList: string[] = [];
        for(let member of memberList.array()) {
            stringList.push("**" + member.user.username + "#" + member.user.discriminator + "** - " + member.id);
        }

        //Make paginator
        let paginator: ReactionPaginator = new ReactionPaginator(stringList, 10, 
            "Members of " + role.name, message.channel, bot, this);

        let paginatedMessage = await paginator.postMessage();

        return {sendHelp: false, command: this, message: message};
    }
}

export class Avatar extends Command {
    constructor(bot: PantherBot) {
        super("avatar", PermissionLevel.Everyone, "Gets avatar for given user", bot, {usage: "<user>"});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        //Get user
        let user: User = await CommandUtils.parseUser(args.join(" "), message.client);

        if(user === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        //Build the embed
        let avatarUrl: string = user.displayAvatarURL({size: 4096, format: "png", dynamic: true});
        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(message.channel, bot))
            .setImage(avatarUrl)
            .setAuthor(user.username + "#" + user.discriminator, avatarUrl, avatarUrl);
        
        await message.channel.send(embed);

        return {sendHelp: false, command: this, message: message};
    }
}

export class Stats extends Command {
    constructor(bot: PantherBot) {
        super("stats", PermissionLevel.Everyone, "Gets bot statistics", bot, {aliases: ["statistics"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(message.channel, bot))
            .addField("RAM Usage", Math.floor(process.memoryUsage().rss / 1048576) + "MB", true)
            .addField("Load",await this.getLoadString(), true)
            .addField("Uptime", await this.getFormattedUptime(), true)
            .addField("User Count", await this.getUserCount(message.client), true)
            .addField("Guild Count", message.client.guilds.cache.size, true)
            .addField("Channel Count", message.client.channels.cache.size, true)
            .setAuthor(message.client.user.username + "#" + message.client.user.discriminator, message.client.user.displayAvatarURL({format: "png", dynamic: true, size: 4096}));
        
        await message.channel.send(embed);

        return {sendHelp: false, command: this, message: message};
    }

    private async getFormattedUptime(): Promise<string> {
        let uptime: number = process.uptime();
        let days: number = Math.floor(uptime / 86400);
        uptime = uptime - (days * 86400);

        let hours: number = Math.floor(uptime / 3600);
        uptime = uptime - (hours * 3600);

        let minutes: number = Math.floor(uptime / 60);
        uptime = uptime - minutes * 60;

        let seconds: number = Math.floor(uptime);

        return(`${days}d ${hours}h ${minutes}m ${seconds}s`);        
    }

    private async getUserCount(client: Client): Promise<number> {
        return(client.users.cache.size);
    }

    private async getLoadString(): Promise<string> {
        let load: number[] = os.loadavg();
        let loadString: string = "";

        for(let num of load) {
            loadString += num.toFixed(2) + " ";
        }

        return(loadString.slice(0, loadString.length - 1));
    }
}