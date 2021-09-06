import { PermissionLevel, Command } from 'commands/Command';
import Bot from 'Bot';

import {
  User, GuildMember, Collection, Snowflake, Role, Permissions,
} from 'discord.js';

export default class PermissionsHelper {
  public static async checkPermsAndDM(user: User | GuildMember, command: Command, bot: Bot): Promise<boolean> {
    let permLevel: PermissionLevel;
    let hasPerm = false;
    let inDm = false;
    if (!(user as GuildMember).guild) {
      permLevel = await PermissionsHelper.getUserPermLevel(user as User, bot);
      inDm = true;
    } else {
      permLevel = await PermissionsHelper.getMemberPermLevel(user as GuildMember, bot);
      hasPerm = await PermissionsHelper.checkHasPerm(user as GuildMember, command);
    }

    return (permLevel >= command.permLevel || hasPerm) && (!inDm || command.runsInDm);
  }

  public static async getUserPermLevel(user: User, bot: Bot): Promise<PermissionLevel> {
    if (bot.owners.includes(user.id)) {
      return PermissionLevel.Owner;
    }

    return PermissionLevel.Everyone;
  }

  public static async getMemberPermLevel(member: GuildMember, bot: Bot): Promise<PermissionLevel> {
    const roleList: Collection<Snowflake, Role> = member.roles.cache;
    let tempRole: string | null | undefined;

    if (bot.owners.includes(member.user.id)) {
      return PermissionLevel.Owner;
    }
    if ((tempRole = bot.db.guildConfigs.getAdminRole(member.guild.id)) && roleList.has(tempRole)
            || member.guild.ownerId === member.id) {
      return PermissionLevel.Admin;
    }
    if ((tempRole = bot.db.guildConfigs.getModRole(member.guild.id)) && roleList.has(tempRole)) {
      return PermissionLevel.Mod;
    }
    if ((tempRole = bot.db.guildConfigs.getVipRole(member.guild.id)) && roleList.has(tempRole)) {
      return PermissionLevel.VIP;
    }
    if (member.guild.id != '326543379955580929') { // Shitty disable commands in acai's discord
      return PermissionLevel.Everyone;
    }

    return PermissionLevel.Disabled;
  }

  public static async getString(perms: Permissions): Promise<string> {
    const permsStrings: string[] = [];

    if (perms.has(Permissions.FLAGS.ADMINISTRATOR)) {
      permsStrings.push('ADMINISTRATOR');
      perms = perms.remove(Permissions.FLAGS.ADMINISTRATOR);
    }
    for (const perm of perms.toArray()) {
      permsStrings.push(perm.toString());
    }

    return permsStrings.join(', ');
  }

  private static async checkHasPerm(member: GuildMember, command: Command) {
    if (command.requiredPerm) {
      return member.permissions.any(command.requiredPerm);
    }

    return false;
  }
}
