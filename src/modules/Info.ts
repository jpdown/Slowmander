import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { Client, Collection, GuildMember, Role, Snowflake, User } from "discord.js";
import { PermissionLevel } from "commands/Command";
import { MessageEmbed } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, guild, guildOnly, isMod } from "./ModuleDecorators";
import { PermissionsHelper } from "utils/PermissionsHelper";
import { ButtonPaginator } from "utils/ButtonPaginator";
import { memoryUsage, uptime as process_uptime } from "process";
import { loadavg } from "os";

export class Info extends Module {
    constructor(bot: Bot) {
        super(bot);
    }

    @command(`Get information about a user`)
    @args([
        { name: `user`, type: `member`, description: `The user to grab info on`, optional: true },
    ])
    @guildOnly()
    public async whois(c: CommandContext<true>, user?: GuildMember) {
        let member: GuildMember = user ? user : c.member;
        const avatar: string = member!.displayAvatarURL({
            format: `png`,
            dynamic: true,
            size: 4096,
        });
        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor({name: `${member.user.username}#${member.user.discriminator}`, url: avatar, iconURL: avatar})
            .setThumbnail(avatar)
            .setColor(member.displayColor)
            .setDescription(member.toString())
            .setFooter(`ID: ${member.id}`, avatar)
            .setTimestamp(Date.now());
        if (member.nickname) {
            embed.addField("Nickname", member.nickname, false);
        }
        embed.addField(
            "Registered",
            `<t:${Math.floor(member.user.createdTimestamp / 1000)}>`,
            true
        );
        if (member.joinedTimestamp) {
            embed.addField("Joined", `<t:${Math.floor(member.joinedTimestamp / 1000)}>`, true);
        }
        if (member.premiumSinceTimestamp) {
            embed.addField(
                "Boosted",
                `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}>`,
                true
            );
        }
        embed.addField("Join Position", (await Info.getJoinPos(member)).toString(), false);
        const rolesList: Collection<Snowflake, Role> = member.roles.cache.clone();
        rolesList.sort((a, b) => b.position - a.position);
        rolesList.delete(c.guild!.roles.everyone.id);
        if (rolesList.size > 0) {
            let rolesStr = "";
            rolesList.forEach((role) => {
                rolesStr += `${role.toString()}, `;
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
    @isMod()
    @guildOnly()
    public async roles(c: CommandContext<true>) {
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
    @isMod()
    @guildOnly()
    public async members(c: CommandContext<true>, r: Role) {
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
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .setImage(avatarUrl)
            .setAuthor({name: `${u.username}#${u.discriminator}`, url: avatarUrl, iconURL: avatarUrl});
        await c.reply({ embeds: [embed] });
    }

    @command(`Gets bot information`)
    public async stats(c: CommandContext) {
        const embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .addField("RAM Usage", `${Math.floor(memoryUsage().rss / 1048576)} MB`, true)
            .addField("Load", Info.getLoadString(), true)
            .addField("Uptime", Info.getFormattedUptime(), true)
            .addField("User Count", Info.getUserCount(c.client).toString(), true)
            .addField("Guild Count", c.client.guilds.cache.size.toString(), true)
            .addField("Channel Count", c.client.channels.cache.size.toString(), true);
        await c.reply({ embeds: [embed] });
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
        let loadString = "";
        load.forEach((num) => {
            loadString += `${num.toFixed(2)} `;
        });
        return loadString.slice(0, loadString.length - 1);
    }

    private static async getJoinPos(member: GuildMember): Promise<number> {
        const allMembers: Collection<Snowflake, GuildMember> = await member.guild.members.fetch();
        let joinPos = 1;
        allMembers.forEach((currMember) => {
            if (
                currMember.joinedTimestamp &&
                member.joinedTimestamp &&
                currMember.joinedTimestamp < member.joinedTimestamp
            ) {
                joinPos += 1;
            }
        });
        return joinPos;
    }
}
