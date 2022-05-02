// import { Command } from "commands/Command";
// import type { Bot } from "Bot";

// import {
//     User,
//     GuildMember,
//     Collection,
//     Snowflake,
//     Role,
//     Permissions,
//     GuildChannel,
// } from "discord.js";
// import { CommandContext } from "CommandContext";
// import { Logger } from "Logger";

// export class PermissionsHelper {
//     private static readonly logger: Logger = Logger.getLogger(this);

//     public static async checkPerms(command: Command, user: User, bot: Bot): Promise<boolean>;
//     public static async checkPerms(command: Command, member: GuildMember, bot: Bot, channel: GuildChannel): Promise<boolean>;
//     public static async checkPerms(command: Command, ctx: CommandContext): Promise<boolean>;
//     public static async checkPerms(command: Command, ctxOrMember: CommandContext | GuildMember | User, bot?: Bot, channel?: GuildChannel): Promise<boolean> {
//         let permLevel: PermissionLevel;
//         if (ctxOrMember instanceof CommandContext) {
//             if (ctxOrMember.member) {
//                 permLevel = await PermissionsHelper.getMemberPermLevel(ctxOrMember);
//             } else {
//                 permLevel = await PermissionsHelper.getUserPermLevel(ctxOrMember.user, ctxOrMember.bot);
//             }
//         } else if (ctxOrMember instanceof GuildMember) {
//             if (channel && bot) {
//                 permLevel = await PermissionsHelper.getMemberPermLevel(ctxOrMember, channel, bot);
//             } else {
//                 this.logger.error(`Error when checking permissions: channel=${channel} bot=${bot}`);
//                 permLevel = PermissionLevel.Disabled;
//             }
//         } else if (ctxOrMember instanceof User) {
//             permLevel = await PermissionsHelper.getUserPermLevel(ctxOrMember, bot!);
//         } else {
//             permLevel = PermissionLevel.Disabled;
//         }

//         // return permLevel >= command.permLevel;
//         return false;
//     }

//     public static async getUserPermLevel(user: User, bot: Bot): Promise<PermissionLevel>;
//     public static async getUserPermLevel(ctx: CommandContext): Promise<PermissionLevel>;
//     public static async getUserPermLevel(ctx: CommandContext | User, b?: Bot): Promise<PermissionLevel> {
//         let bot;
//         let user;
//         if (ctx instanceof User) {
//             bot = b;
//             user = ctx;
//         } else {
//             bot = ctx.bot;
//             user = ctx.user;
//         }
//         if (!bot) {
//             return PermissionLevel.Disabled;
//         }

//         if (bot.owners.includes(user.id)) {
//             return PermissionLevel.Owner;
//         }

//         return PermissionLevel.Everyone;
//     }

//     public static async getMemberPermLevel(m: GuildMember, c: GuildChannel, b: Bot): Promise<PermissionLevel>;
//     public static async getMemberPermLevel(ctx: CommandContext): Promise<PermissionLevel>;
//     public static async getMemberPermLevel(mOrCtx: CommandContext | GuildMember, c?: GuildChannel, b?: Bot): Promise<PermissionLevel> {
//         let member;
//         let channel;
//         let bot;
//         if (mOrCtx instanceof CommandContext) {
//             member = mOrCtx.member;
//             channel = mOrCtx.channel as GuildChannel;
//             bot = mOrCtx.bot;
//         } else {
//             member = mOrCtx;
//             channel = c;
//             bot = b;
//         }
//         if (!member || !channel || !bot) {
//             return PermissionLevel.Disabled;
//         }
//         const roleList: Collection<Snowflake, Role> = member.roles.cache;
//         let tempRole: string | null | undefined;

//         if (bot.owners.includes(member.user.id)) {
//             return PermissionLevel.Owner;
//         }
//         // Check if member has slash commands permission in channel
//         if (!channel.permissionsFor(member).has(Permissions.FLAGS.USE_APPLICATION_COMMANDS)) {
//             return PermissionLevel.Disabled;
//         }
//         // We have slash command permission, continue
//         if (
//             (tempRole = bot.db.guildConfigs.getAdminRole(member.guild.id)) &&
//             (roleList.has(tempRole) || member.guild.ownerId === member.id)
//         ) {
//             return PermissionLevel.Admin;
//         }
//         if (
//             (tempRole = bot.db.guildConfigs.getModRole(member.guild.id)) &&
//             roleList.has(tempRole)
//         ) {
//             return PermissionLevel.Mod;
//         }
//         if (
//             (tempRole = bot.db.guildConfigs.getVipRole(member.guild.id)) &&
//             roleList.has(tempRole)
//         ) {
//             return PermissionLevel.VIP;
//         }

//         return PermissionLevel.Everyone;
//     }

//     public static async getString(perms: Permissions): Promise<string> {
//         const permsStrings: string[] = [];
//         let permsNoAdmin: Permissions = perms;

//         if (perms.has(Permissions.FLAGS.ADMINISTRATOR)) {
//             permsStrings.push("ADMINISTRATOR");
//             permsNoAdmin = perms.remove(Permissions.FLAGS.ADMINISTRATOR);
//         }

//         permsNoAdmin.toArray().forEach((perm) => {
//             permsStrings.push(perm.toString());
//         });

//         return permsStrings.join(", ");
//     }
// }
