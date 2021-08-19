import { PermissionLevel } from "../commands/Command";
import { User, GuildMember, Collection, Snowflake, Role, Permissions } from "discord.js";
import { PantherBot } from "../Bot";
import { Command } from "../commands/Command";

export class PermissionsHelper {
    
    public static async checkPermsAndDM(user: User | GuildMember, command: Command, bot: PantherBot): Promise<boolean> {
        let permLevel: PermissionLevel;
        let hasPerm: boolean;
        let inDm: boolean = false;
        if(!(user as GuildMember).guild) {
            permLevel = await PermissionsHelper.getUserPermLevel(user as User, bot);
            inDm = true;
        }
        else {
            permLevel = await PermissionsHelper.getMemberPermLevel(user as GuildMember, bot);
            hasPerm = await PermissionsHelper.checkHasPerm(user as GuildMember, command);
        }
        
        return((permLevel >= command.permLevel || hasPerm) && (!inDm || command.runsInDm));
    }

    public static async getUserPermLevel(user: User, bot: PantherBot): Promise<PermissionLevel> {
        if(bot.owners.includes(user.id)) {
            return(PermissionLevel.Owner);
        }
        else {
            return(PermissionLevel.Everyone);
        }
    }

    public static async getMemberPermLevel(member: GuildMember, bot: PantherBot): Promise<PermissionLevel> {
        let roleList: Collection<Snowflake, Role> = member.roles.cache;

        if(bot.owners.includes(member.user.id)) {
            return(PermissionLevel.Owner);
        }
        else if(roleList.has(await bot.configs.guildConfig.getAdminRole(member.guild.id))
            || member.guild.ownerId === member.id) {
                return(PermissionLevel.Admin)
        }
        else if(roleList.has(await bot.configs.guildConfig.getModRole(member.guild.id))) {
            return(PermissionLevel.Mod)
        }
        else if(roleList.has(await bot.configs.guildConfig.getVipRole(member.guild.id))) {
            return(PermissionLevel.VIP)
        }
        else if(member.guild.id != "326543379955580929") { //Shitty disable commands in acai's discord
            return(PermissionLevel.Everyone);
        }
        else {
            return(PermissionLevel.Disabled);
        }
    }

    public static async getString(perms: Permissions): Promise<string> {
        let permsStrings: string[] = [];

        if(perms.has(Permissions.FLAGS.ADMINISTRATOR)) {
            permsStrings.push("ADMINISTRATOR");
            perms = perms.remove(Permissions.FLAGS.ADMINISTRATOR)
        }
        for(let perm of perms.toArray()) {
            permsStrings.push(perm.toString());
        }

        return(permsStrings.join(", "));
    }

    private static async checkHasPerm(member: GuildMember, command: Command) {
        if(command.requiredPerm) {
            return(member.permissions.any(command.requiredPerm))
        }

        return(false);
    }
}