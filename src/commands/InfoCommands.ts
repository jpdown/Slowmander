import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';
import { CommandUtils } from '..//utils/CommandUtils';
import { PermissionsHelper } from '../utils/PermissionsHelper';

import {Message, GuildMember, MessageEmbed, Role} from 'discord.js';

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
        let rolesList: Role[] = member.roles.cache.array();
        if(rolesList.length > 1) {
            rolesList.pop();
            embed.addField(`Roles (${rolesList.length})`, rolesList.join(", "), false);
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