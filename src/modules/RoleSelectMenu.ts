// import type { Bot } from "Bot";
// import type { CommandContext } from "CommandContext";
// import { CommandArgs } from "commands/Command";
// import type { APIMessage } from "discord-api-types";
// import {
//     Emoji,
//     EmojiResolvable,
//     GuildEmoji,
//     Message,
//     MessageActionRow,
//     MessageSelectMenu,
//     MessageSelectOptionData,
//     Role,
//     TextChannel,
// } from "discord.js";
// import { Permissions } from "discord.js";
// import { Module } from "./Module";
// import { args, group, guild, guildOnly, isMod, subcommand } from "./ModuleDecorators";

// export class RoleSelectMenu extends Module {
//     public constructor(bot: Bot) {
//         super(bot);
//     }

//     @group("Self assign roles list commands")
//     public async selfassignlist() {}

//     @subcommand("selfassignlist", "Adds a self assignable role")
//     @isMod()
//     @args([
//         { name: "emote", description: "Icon to use for the role", type: "emoji" },
//         { name: "role", description: "The role to add", type: "role" },
//         { name: "message", description: "Message to place at the top of the list", type: "string" },
//         {
//             name: "channel",
//             description:
//                 "(Optional) The channel to put the list in, defaults to the channel te command was used in",
//             type: "emoji",
//             optional: true,
//         },
//     ])
//     @guildOnly()
//     public async addrole(context: CommandContext<true>, emote: CommandArgs["emoji"], role: Role, listMessage: string, chan?: TextChannel): Promise<Menu | undefined> {
//         // TODO parse a message link, maybe a text file if possible?
//         await context.defer();
//         let channel = chan ? chan : context.channel;
//         let map: Map<Role, EmojiResolvable | undefined> = new Map();
//         let emoteId = typeof emote === "string" ? emote : emote.id;
//         if (!emoteId) {
//             this.logger.warning("Somehow don't have an emote id.");
//             return;
//         }
//         let config = context.bot.db.reactionRoles.getReactionRole(context.message!, emoteId);

//         if (config === null) {
//             await context.reply("Error checking database.");
//             return;
//         }

//         if (config) {
//             await context.reply("Role already exists!");
//             return;
//         }

//         if (!(channel instanceof TextChannel)) {
//             await context.reply(`Invalid channel provided.`, true);
//             return;
//         }

//         if (!(await this.checkPerms(context, channel, role))) {
//             return;
//         }

//         map.set(role, emote);
//         const dbAdd = context.bot.db.reactionRoles.setAutoAssignRole(context.interaction!, emoteId, role);
//         if (!dbAdd) {
//             await context.reply("Error adding self assign role.");
//             return;
//         }
//         return new Menu(context, listMessage, map);
//     }

//     public async addroles(context: CommandContext<true>, input: Map<Role, GuildEmoji | string | undefined>, listMessage: string, channel: TextChannel) {
//         let menu: Menu | undefined;
//         let set = false;
//         for (let [role, emoji] of input) {
//             emoji = emoji as string;
//             if (!set) {
//                 menu = await this.addrole(context, emoji, role, listMessage, channel)
//                 set = true;
//             }
//         }
//         if (!menu) return; // only should be undefined when it fails anyways 
//         await menu.create(input);
//     }

//     @subcommand("selfassignlist", "Removes a self assignable role")
//     public async removerole() {}

//     private async checkPerms(context: CommandContext<true>, listChannel: TextChannel, role: Role): Promise<boolean> {
//         if (role.guild.me && (listChannel as TextChannel).guild.me) {
//             // check if we have the ability to manage roles
//             if (!role.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
//                 await context.reply(
//                     `I do not have the Manage Roles permission.`,
//                     true,
//                 );
//                 return false;
//             }

//             // check if the role to give is below our highest
//             if (role.comparePositionTo(role.guild.me.roles.highest) > 0) {
//                 await context.reply(
//                     `My highest role is below ${role.name}, so it cannot be assigned.`,
//                     true,
//                 );
//                 return false;
//             }

//             // check if we can delete messages
//             if (!role.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
//                 await context.reply(
//                     `I can't manage messages.`,
//                     true,
//                 );
//                 return false;
//             }

//             return true;
//         } else {
//             return false;
//         }
//     }
// }

// export class Menu {
//     private channel: TextChannel;
//     private context: CommandContext;
//     private message: string;
//     private roles: Map<Role, EmojiResolvable | undefined> = new Map();

//     public constructor(context: CommandContext, message: string, map: Map<Role, EmojiResolvable | undefined>, channel?: TextChannel) {
//         this.channel = channel ? channel : (context.channel as TextChannel);
//         this.context = context;
//         this.message = message;
//         this.roles = map;
//     }

//     public async addRole(role: Role, emoji: GuildEmoji) {
//         this.roles.set(role, emoji);
//     }

//     public async removeRole(role: Role) {
//         this.roles.delete(role);
//     }

//     public async create(roles: Map<Role, GuildEmoji | string | undefined>): Promise<Message<boolean> | APIMessage | undefined> {
//         let msg: Message<boolean> | undefined;
//         let menu: MessageActionRow;

//         if (!roles) {
//             await this.context.reply("Error when posting list");
//             return;
//         }

//         if (roles.size === 0) {
//             await this.context.reply("No roles given!");
//             return;
//         }

//         // this should work? it assumes the only message in the channel is the menu though
//         msg = (await this.channel.messages.fetch({ limit: 5 }))
//             .filter((m) => m.author.id === this.context.bot.client.user.id)
//             .at(0);
//         if (msg) {
//             await msg.delete();
//         }

//         const options: MessageSelectOptionData[] = [];
//         roles.forEach((e, r) => { // emoji | role
//             options.push({ label: r.name, value: r.name, emoji: e });
//         });

//         menu = new MessageActionRow().addComponents(
//             new MessageSelectMenu()
//                 .setCustomId("self_assign_roles")
//                 .setPlaceholder("Select a role")
//                 .addOptions(options)
//         );

//         await this.channel.send({ content: this.message, components: [menu] });
//         return await this.context.reply(
//             "Successfully posted self assign roles.",
//             true,
//         );
//     }
// }
