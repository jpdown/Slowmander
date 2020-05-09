import { PermissionLevel } from "../commands/Command";
import { User, GuildMember, Collection, Snowflake, Role } from "discord.js";
import { PantherBot } from "../Bot";

export class PermissionsHelper {
    public static async getUserPermLevel(user: User, bot: PantherBot): Promise<PermissionLevel> {
        if(user.id === bot.config.owner) {
            return(PermissionLevel.Owner);
        }
        else {
            return(PermissionLevel.Everyone);
        }
    }

    public static async getMemberPermLevel(member: GuildMember, bot: PantherBot): Promise<PermissionLevel> {
        let roleList: Collection<Snowflake, Role> = member.roles.cache;

        if(member.user.id === bot.config.owner) {
            return(PermissionLevel.Owner);
        }
        else if(roleList.has(bot.config.adminRole)) {
            return(PermissionLevel.Admin)
        }
        else if(roleList.has(bot.config.modRole)) {
            return(PermissionLevel.Mod)
        }
        else if(roleList.has(bot.config.vipRole)) {
            return(PermissionLevel.VIP)
        }
        else {
            return(PermissionLevel.Everyone);
        }
    }
}