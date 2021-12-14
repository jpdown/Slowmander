import { PermissionLevel, Command, CommandArgument } from 'commands/Command';
import type { Bot } from 'Bot';

import {
  User, GuildMember, Collection, Snowflake, Role, Permissions, GuildChannel,
} from 'discord.js';
import type { CommandContext } from 'CommandContext';

export class PermissionsHelper {
  public static async checkPerms(ctx: CommandContext, command: Command): Promise<boolean> {
    let permLevel: PermissionLevel;
    if (!ctx.member) {
      permLevel = await PermissionsHelper.getUserPermLevel(ctx);
    } else {
      permLevel = await PermissionsHelper.getMemberPermLevel(ctx);
    }

    return permLevel >= command.permLevel;
  }

  public static async getUserPermLevel(ctx: CommandContext): Promise<PermissionLevel> {
    if (ctx.bot.owners.includes(ctx.user.id)) {
      return PermissionLevel.Owner;
    }

    return PermissionLevel.Everyone;
  }

  public static async getMemberPermLevel(ctx: CommandContext): Promise<PermissionLevel> {
    let member = ctx.member!;
    let channel = ctx.channel as GuildChannel;
    const roleList: Collection<Snowflake, Role> = member.roles.cache;
    let tempRole: string | null | undefined;

    if (ctx.bot.owners.includes(member.user.id)) {
      return PermissionLevel.Owner;
    }
    // Check if member has slash commands permission in channel
    if (!channel.permissionsFor(member).has(Permissions.FLAGS.USE_APPLICATION_COMMANDS)) {
      return PermissionLevel.Disabled;
    }
    // We have slash command permission, continue
    if (
      (tempRole = ctx.bot.db.guildConfigs.getAdminRole(member.guild.id))
      && (roleList.has(tempRole) || member.guild.ownerId === member.id)
    ) {
      return PermissionLevel.Admin;
    }
    if ((tempRole = ctx.bot.db.guildConfigs.getModRole(member.guild.id)) && roleList.has(tempRole)) {
      return PermissionLevel.Mod;
    }
    if ((tempRole = ctx.bot.db.guildConfigs.getVipRole(member.guild.id)) && roleList.has(tempRole)) {
      return PermissionLevel.VIP;
    }

    return PermissionLevel.Everyone;
  }

  public static async getString(perms: Permissions): Promise<string> {
    const permsStrings: string[] = [];
    let permsNoAdmin: Permissions = perms;

    if (perms.has(Permissions.FLAGS.ADMINISTRATOR)) {
      permsStrings.push('ADMINISTRATOR');
      permsNoAdmin = perms.remove(Permissions.FLAGS.ADMINISTRATOR);
    }

    permsNoAdmin.toArray().forEach((perm) => {
      permsStrings.push(perm.toString());
    });

    return permsStrings.join(', ');
  }
}
