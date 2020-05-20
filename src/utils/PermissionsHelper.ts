import { PermissionLevel } from "../commands/Command";
import { User, GuildMember, Collection, Snowflake, Role, Message } from "discord.js";
import { PantherBot } from "../Bot";
import { Command } from "../commands/Command";

export class PermissionsHelper {
    public static async getUserPermLevel(user: User, bot: PantherBot): Promise<PermissionLevel> {
        if(user.id === bot.credentials.owner) {
            return(PermissionLevel.Owner);
        }
        else {
            return(PermissionLevel.Everyone);
        }
    }

    public static async getMemberPermLevel(member: GuildMember, bot: PantherBot): Promise<PermissionLevel> {
        let roleList: Collection<Snowflake, Role> = member.roles.cache;

        if(member.user.id === bot.credentials.owner) {
            return(PermissionLevel.Owner);
        }
        else if(roleList.has(await bot.configs.guildConfig.getAdminRole(member.guild.id))) {
            return(PermissionLevel.Admin)
        }
        else if(roleList.has(await bot.configs.guildConfig.getModRole(member.guild.id))) {
            return(PermissionLevel.Mod)
        }
        else if(roleList.has(await bot.configs.guildConfig.getVipRole(member.guild.id))) {
            return(PermissionLevel.VIP)
        }
        else {
            return(PermissionLevel.Everyone);
        }
    }

    public static async checkPermsAndDM(message: Message, command: Command, bot: PantherBot): Promise<boolean> {
        let permLevel: PermissionLevel;
        let inDm: boolean = false;
        if(message.member === null) {
            permLevel = await PermissionsHelper.getUserPermLevel(message.author, bot);
            inDm = true;
        }
        else {
            permLevel = await PermissionsHelper.getMemberPermLevel(message.member, bot)
        }

        return(permLevel >= command.permLevel && (!inDm || command.runsInDm));
    }
}