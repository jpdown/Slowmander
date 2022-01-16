import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import {
    Emoji,
    GuildEmoji,
    Message,
    MessageActionRow,
    MessageSelectMenu,
    MessageSelectOptionData,
    Role,
    TextChannel,
} from "discord.js";
import { Permissions } from "discord.js";
import { Module } from "./Module";
import { args, group, guild, isMod, subcommand } from "./ModuleDecorators";

export class RoleSelectMenu extends Module {
    private static emojiRegex = /\p{EPres}|\p{ExtPict}/gu;

    public constructor(bot: Bot) {
        super(bot);
    }

    @group("Self assign roles list commands")
    public async selfassignlist() {}

    @subcommand("selfassignlist", "Adds a self assignable role")
    @isMod()
    @guild("472222827421106201")
    @args([
        { name: "emote", description: "Icon to use for the role", type: "string" },
        { name: "role", description: "The role to add", type: "role" },
        { name: "message", description: "Message to place at the top of the list", type: "emoji" },
        {
            name: "channel",
            description:
                "(Optional) The channel to put the list in, defaults to the channel te command was used in",
            type: "emoji",
            optional: true,
        },
    ])
    public async addrole(context: CommandContext<true>, emoteInput: string, role: Role, listMessage: string, chan?: TextChannel) {
        // TODO parse a message link, maybe a text file if possible?
        await context.defer();
        let channel = chan ? chan : context.channel;
        let map: Map<Role, GuildEmoji | string | undefined> = new Map();
        let emote: GuildEmoji | string | undefined;
        let emoteId = emoteInput;
        if (!emoteInput.match(RoleSelectMenu.emojiRegex)) {
            emoteId = emoteInput.split(":")[2].replace(">", "");
            emote = context.bot.client.emojis.cache.filter((e) => e.id === emoteId).at(0);
        }
        let config = context.bot.db.reactionRoles.getReactionRole(context.message!, emoteId);

        if (config === null) {
            await context.reply("Error checking database.");
            return;
        }

        if (config) {
            await context.reply("Role already exists!");
            return;
        }

        if (!(channel instanceof TextChannel)) {
            await context.reply({ content: `Invalid channel provided.`, ephemeral: true });
            return;
        }

        if (!(await this.checkPerms(context, channel, role))) {
            return;
        }

        map.set(role, emote);
        let menu = new Menu(context, map, listMessage);
        await menu.create();
    }

    @subcommand("selfassignlist", "Removes a self assignable role")
    public async removerole() {}

    private async checkPerms(context: CommandContext<true>, listChannel: TextChannel, role: Role): Promise<boolean> {
        if (role.guild.me && (listChannel as TextChannel).guild.me) {
            // check if we have the ability to manage roles
            if (!role.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
                await context.reply({
                    content: `I do not have the Manage Roles permission.`,
                    ephemeral: true,
                });
                return false;
            }

            // check if the role to give is below our highest
            if (role.comparePositionTo(role.guild.me.roles.highest) > 0) {
                await context.reply({
                    content: `My highest role is below ${role.name}, so it cannot be assigned.`,
                    ephemeral: true,
                });
                return false;
            }

            // check if we can delete messages
            if (!role.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
                await context.reply({
                    content: `I can't manage messages.`,
                    ephemeral: true,
                });
                return false;
            }

            return true;
        } else {
            return false;
        }
    }
}

export class Menu {
    private channel: TextChannel;
    private context: CommandContext;
    private message: string;
    private roles: Map<Role, GuildEmoji | string | undefined> = new Map();

    public constructor(context: CommandContext, roles: Map<Role, GuildEmoji | string | undefined>, message: string, channel?: TextChannel
    ) {
        this.roles = roles;
        this.channel = channel ? channel : (context.channel as TextChannel);
        this.context = context;
        this.message = message;
    }

    public async addRole(role: Role, emoji: GuildEmoji) {
        this.roles.set(role, emoji);
    }

    public async removeRole(role: Role) {
        this.roles.delete(role);
    }

    public async create() {
        let msg: Message<boolean> | undefined;
        let menu: MessageActionRow;

        if (!this.roles) {
            await this.context.reply("Error when posting list");
            return;
        }

        if (this.roles.size === 0) {
            await this.context.reply("No roles given!");
            return;
        }

        // this should work? it assumes the only message in the channel is the menu though
        msg = (await this.channel.messages.fetch({ limit: 5 }))
            .filter((m) => m.author.id === this.context.bot.client.user.id)
            .at(0);
        if (msg) {
            await msg.delete();
        }

        const options: MessageSelectOptionData[] = [];
        this.roles.forEach((e, r) => { // emoji | role
            options.push({ label: r.name, value: r.name, emoji: e });
        });

        menu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("self_assign_roles")
                .setPlaceholder("Select a role")
                .addOptions(options)
        );

        await this.channel.send({ content: this.message, components: [menu] });
        await this.context.reply({
            content: "Successfully posted self assign roles.",
            ephemeral: true,
        });
    }
}
