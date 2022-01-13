import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import { CommandGroup } from "commands/CommandGroup";
import {
    GuildChannel,
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
import { args, command, group, guild, isMod, subcommand } from "./ModuleDecorators";

export class RoleSelectMenu extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @group("Self assign roles list commands")
    public async selfassignlist() {}

    @subcommand("selfassignlist", "Adds a self assignable role")
    @isMod()
    @guild("472222827421106201")
    @args([
        { name: "emote", description: "Icon to use for the role", type: "emoji" },
        { name: "role", description: "The role to add", type: "emoji" },
        { name: "message", description: "Message to place at the top of the list", type: "emoji" },
        {
            name: "channel",
            description:
                "(Optional) The channel to put the list in, defaults to the channel te command was used in",
            type: "emoji",
            optional: true,
        },
    ])
    public async addrole(context: CommandContext<true>,emote: GuildEmoji,role: Role,listMessage: string,chan?: TextChannel) {
        // TODO parse a message link, maybe a text file if possible?
        await context.defer();
        let channel = chan ? chan : context.channel;
        if (!(channel instanceof TextChannel)) {
            await context.reply({ content: `Invalid channel provided.`, ephemeral: true });
            return;
        }
        if (!(await this.checkPerms(context, channel, role))) {
            return;
        }
        const map: Map<Role, GuildEmoji | undefined> = new Map();
        const menu = new Menu(context, map);
        await menu.create(listMessage, map);
    }

    @subcommand("selfassignlist", "Removes a self assignable role")
    public async removerole() {}

    private async checkPerms(context: CommandContext<true>,listChannel: TextChannel,role: Role): Promise<boolean> {
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
                    ephemeral: true 
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
    private roles: Map<Role, GuildEmoji | undefined> = new Map();
    private context: CommandContext;

    public constructor(
        context: CommandContext,
        roles: Map<Role, GuildEmoji | undefined>,
        channel?: TextChannel
    ) {
        this.roles = roles;
        this.channel = channel ? channel : (context.channel as TextChannel);
        this.context = context;
    }

    public async addRole(role: Role, emoji: GuildEmoji) {
        this.roles.set(role, emoji);
    }

    public async removeRole(role: Role) {
        this.roles.delete(role);
    }

    public async create(message: string, roles: Map<Role, GuildEmoji | undefined>) {
        if (!roles) {
            await this.context.reply("Error when posting list");
            return;
        }
        // this should work? it assumes the only message in the channel is the menu though
        let msg = (await this.channel.messages.fetch({ limit: 5 }))
            .filter((m) => m.author.id === this.context.bot.client.user.id)
            .at(0);
        if (msg) {
            await msg.delete();
        }
        let options: MessageSelectOptionData[] = [];
        roles.forEach((e, r) => { // emoji | role
            if (e) {
                options.push({ label: r.name, value: r.name, emoji: e });
            } else {
                options.push({ label: r.name, value: r.name });
            }
        });
        const menu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("self_assign_roles")
                .setPlaceholder("Select a role")
                .addOptions(options)
        );
        await this.channel.send({ content: message, components: [menu] });
        await this.context.reply({
            content: "Successfully posted self assign roles.",
            ephemeral: true,
        });
    }
}
