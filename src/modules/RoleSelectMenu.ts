import { ConfigError } from "@twurple/api/lib";
import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import { GuildChannel, GuildChannelResolvable, GuildEmoji, Message, MessageManager, ReactionEmoji, Role, Sweepers, TextBasedChannel, TextChannel } from "discord.js";
import { Permissions } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { command, isMod } from "./ModuleDecorators";

export class RoleSelectMenu extends Module {
    private emojiRegex = /\p{EPres}|\p{ExtPict}/gu; // Emoji_Presentation and Extended_Pictographic

    public constructor(bot: Bot) {
        super(bot);
    }

    @command("Adds a self assignable role.")
    @isMod()
    public async reactadd(context: CommandContext<true>, emote: GuildEmoji, role: Role) {
        // TODO parse a message link
        const config = context.bot.db.reactionRoles.getReactionRole(context.message!,emote.identifier);
        if (config === null) {
            await context.reply({content: `Database error.`, ephemeral: true});
            return;
        }
        if (config) {
            await context.reply({content: `Role is already self assignable.`, ephemeral: true});
            return;
        }
        if (!(context.channel instanceof TextChannel)) {
            await context.reply({content: `Invalid channel given, must be a guild channel.`, ephemeral: true})
            return;
        }
        if (!await this.checkPerms(context, context.channel, role)) {
            return; 
        }
    }

    private async checkPerms(context: CommandContext<true>, listChannel: TextChannel, role: Role): Promise<boolean> {
        if (role.guild.me && listChannel.guild.me) {
            // check if we have the ability to manage roles
            if (!role.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
                await context.reply({content: `I do not have the Manage Roles permission.`, ephemeral: true});
                return false;
            }
            // check if the role to give is below our highest
            if (role.comparePositionTo(role.guild.me.roles.highest) > 0) {
                await context.reply({content: `My highest role is below ${role.name}, so it cannot be assigned.`, ephemeral: true});
                return false;
            }
            return true;
        } else {
            return false;
        }
    }
}
