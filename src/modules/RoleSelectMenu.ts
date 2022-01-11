import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import { GuildEmoji, MessageActionRow, MessageSelectMenu, MessageSelectOptionData, Role, TextChannel } from "discord.js";
import { Permissions } from "discord.js";
import { Module } from "./Module";
import { args, command, guild, isMod } from "./ModuleDecorators";

export class RoleSelectMenu extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("Adds a self assignable role lmao")
    @isMod()
    @guild("472222827421106201")
    @args([{name: "lol", description: "lol", type: "string"}])
    public async selfassignlist(context: CommandContext<true>, emote: GuildEmoji, role: Role, listMessage: string, chan?: TextChannel) {
        // TODO parse a message link
        await context.defer();
        let channel = chan ? chan : context.channel as TextChannel; // lmao
        if (!await this.checkPerms(context, channel, role)) {
            return; 
        }
        const map: Map<Role, GuildEmoji | undefined> = new Map();
        const menu = new Menu(context, map);
        await menu.create(listMessage, map);
    }

    private async checkPerms(context: CommandContext<true>, listChannel: TextChannel, role: Role): Promise<boolean> {
        if (role.guild.me && (listChannel as TextChannel).guild.me) {
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

export class Menu {
    private context: CommandContext;
    private roles: Map<Role, GuildEmoji | undefined> = new Map();

    public constructor(context: CommandContext, roles: Map<Role, GuildEmoji | undefined>) {
        this.context = context;
        this.roles = roles;
    }

    public async addRole(role: Role, emoji: GuildEmoji) {
        this.roles.set(role, emoji);
    }

    public async removeRole(role: Role) {
        this.roles.delete(role);
    }

    public async create(message: string, roles: Map<Role, GuildEmoji | undefined>) {
        // we could probably make this delete the old message if it's already posted, basically editing the list
        if (!this.context) return;
        if (!roles) {
            await this.context.reply("Error when posting list");
            return;
        }
        let options: MessageSelectOptionData[] = [];
        roles.forEach((e, r) => { // emoji | role
            if (e) {
                options.push({label: r.name, value: r.name, emoji: e})
            } else {
                options.push({label: r.name, value: r.name})
            }
        })
        const menu = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId("self_assign_roles").setPlaceholder("Select a role").addOptions(options));
        await this.context.channel.send({content: message, components: [menu]})
        await this.context.reply({content: "Successfully posted self assign roles.", ephemeral: true})
    }
}
