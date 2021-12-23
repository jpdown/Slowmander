import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { Client, Collection, GuildMember, Role, Snowflake, User } from "discord.js";
import { PermissionLevel } from "commands/Command";
import { MessageEmbed } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, guild } from "./ModuleDecorators";
import { PermissionsHelper } from "utils/PermissionsHelper";
import { ButtonPaginator } from "utils/ButtonPaginator";
import { memoryUsage, uptime as process_uptime } from 'process';
import { loadavg } from 'os';

export class Info extends Module {
    constructor(bot: Bot) {
        super(bot);
    }

    @command(`Get information about a user`)
    @args([
        { name: `user`, type: `member`, description: `The user to grab info on`, optional: true },
    ])
    @guild("472222827421106201")
    public async whois(c: CommandContext, user?: GuildMember) {
        let member: GuildMember | undefined = user ? user : c.member;
        if (!member) {
            await c.reply(`Error parsing user, please try again.`);
            return;
        }
        if (!c.guild) {
            await c.reply(`This command must be run in a server!`);
            return;
        }
        const avatar: string = member!.displayAvatarURL({
            format: `png`,
            dynamic: true,
            size: 4096,
        });
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor(`${member.user.username}#${member.user.discriminator}`, avatar, avatar)
            .setThumbnail(avatar)
            .setColor(member.displayColor)
            .setDescription(member.toString())
            .setFooter(`ID: ${member.id}`, avatar)
            .setTimestamp(Date.now());
        if (member.nickname) {
            embed.addField("Nickname", member.nickname, false);
        }
        embed.addField("Registered", member.user.createdAt.toUTCString(), true);
        if (member.joinedAt) {
            embed.addField("Joined", member.joinedAt.toUTCString(), true);
        }
        if (member.premiumSince) {
            embed.addField("Boosted", member.premiumSince.toUTCString(), true);
        }
        embed.addField("Join Position", (await Info.getJoinPos(member)).toString(), false);
        const rolesList: Collection<Snowflake, Role> = member.roles.cache.clone();
        rolesList.sort((a, b) => b.position - a.position);
        rolesList.delete(c.guild!.roles.everyone.id);
        if (rolesList.size > 0) {
            let rolesStr = "";
            rolesList.forEach((role) => {
                rolesStr += `${role.name}, `;
            });
            embed.addField(`Roles (${rolesList.size})`, rolesStr.slice(0, -2), false);
        }
        const permLevel: PermissionLevel = await PermissionsHelper.getMemberPermLevel(c);
        if (permLevel > PermissionLevel.Everyone) {
            embed.addField("Bot Permission", PermissionLevel[permLevel], false);
        }
        await c.reply({ embeds: [embed] });
    }

    @command(`Get roles in a discord`)
    public async roles(c: CommandContext) {
        if (!c.guild) {
            await c.reply(`This command must be run in a server!`);
            return;
        }
        const rolesList: Collection<Snowflake, Role> = await c.guild!.roles.fetch();
        const output: string[] = [];
        rolesList.sort((a, b) => b.position - a.position);
        rolesList.delete(c.guild!.roles.everyone.id);
        rolesList.forEach((r) => output.push(`${r.name} - ${r.members.size} members.`));
        const paginator = new ButtonPaginator(output, c, 8, `Roles in ${c.guild!.name}.`);
        await paginator.postMessage();
    }

    @command(`Get roles in a discord`)
    @args([{ name: `role`, type: `role`, description: `The role to check` }])
    public async members(c: CommandContext, r: Role) {
        if (!r) {
            await c.reply("Role could not be found!");
            return;
        }
        const mList: Collection<Snowflake, GuildMember> = r.members;
        const output: string[] = [];
        mList.forEach((m) =>
            output.push(`**${m.user.username}#${m.user.discriminator}** - ${m.id}`)
        );
        const paginator = new ButtonPaginator(output, c, 8, `Members of ${r.name}.`);
        await paginator.postMessage();
    }

    @command(`Get a users avatar`)
    @args([{ name: `user`, type: `user`, description: `The user to get the picture for` }])
    public async avatar(c: CommandContext, u: User) {
        if (!u) {
            await c.reply("User could not be found!");
            return;
        }
        const avatarUrl: string = u.displayAvatarURL({ size: 4096, format: "png", dynamic: true });
        const embed: MessageEmbed = new MessageEmbed()
            .setColor(await new CommandUtils(c.bot).getSelfColor(c.channel))
            .setImage(avatarUrl)
            .setAuthor(`${u.username}#${u.discriminator}`, avatarUrl, avatarUrl);
        await c.reply({ embeds: [embed] });
    }

    @command(`Gets bot information`)
    public async stats(c: CommandContext) {
        const embed: MessageEmbed = new MessageEmbed()
            .setColor(await new CommandUtils(c.bot).getSelfColor(c.channel))
            .addField("RAM Usage", `${Math.floor(memoryUsage().rss / 1048576)} MB`, true)
            .addField("Load", Info.getLoadString(), true)
            .addField("Uptime", Info.getFormattedUptime(), true)
            .addField("User Count", Info.getUserCount(c.client).toString(), true)
            .addField("Guild Count", c.client.guilds.cache.size.toString(), true)
            .addField("Channel Count", c.client.channels.cache.size.toString(), true);
        await c.reply({ embeds: [embed]})
    }

    private static getFormattedUptime(): string {
        let uptime: number = process_uptime();
        const days: number = Math.floor(uptime / 86400);
        uptime -= days * 86400;
        const hours: number = Math.floor(uptime / 3600);
        uptime -= hours * 3600;
        const minutes: number = Math.floor(uptime / 60);
        uptime -= minutes * 60;
        const seconds: number = Math.floor(uptime);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }
    
      private static getUserCount(client: Client): number {
        return client.users.cache.size;
      }
    
      private static getLoadString(): string {
        const load: number[] = loadavg();
        let loadString = '';
        load.forEach((num) => {
          loadString += `${num.toFixed(2)} `;
        });
        return loadString.slice(0, loadString.length - 1);
      }

    private static async getJoinPos(member: GuildMember): Promise<number> {
        const allMembers: Collection<Snowflake, GuildMember> = await member.guild.members.fetch();
        let joinPos = 1;
        allMembers.forEach((currMember) => {
            if (currMember.joinedTimestamp && member.joinedTimestamp && currMember.joinedTimestamp < member.joinedTimestamp) {
                joinPos += 1;
            }
        });
        return joinPos;
    }
}
