import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';
import { CommandUtils } from '..//utils/CommandUtils';
import { PermissionsHelper } from '../utils/PermissionsHelper';

import {Message, GuildMember, MessageEmbed, Role, User, Collection, Snowflake} from 'discord.js';
import { ReactionPaginator } from '../utils/ReactionPaginator';

export class Whois extends Command {
    constructor() {
        super("whois", PermissionLevel.Everyone, "Gets information on a member", "[member]", false);
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let member: GuildMember = message.member;

        if(args.length > 0) {
            let parsedMember: GuildMember = await CommandUtils.parseMember(args.join(" "), message.guild);
            if(parsedMember !== undefined) {
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
}

export class Roles extends Command {
    constructor() {
        super("roles", PermissionLevel.Mod, "Gets list of roles", "", false);
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
    constructor() {
        super("members", PermissionLevel.Mod, "Gets list of members for given role", "<role>", false);
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
    constructor() {
        super("avatar", PermissionLevel.Everyone, "Gets avatar for given user", "<user>", true);
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