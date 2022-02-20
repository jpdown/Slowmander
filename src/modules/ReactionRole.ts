import { Bot } from "Bot";
import { CommandContext } from "CommandContext";
import { EmojiResolvable, GuildChannelResolvable, Message, MessageReaction, Role, TextBasedChannel } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, group, guildOnly, isMod, subcommand } from "./ModuleDecorators";
import { Permissions } from "discord.js";
import { Logger } from "Logger";
import { ButtonPaginator } from "utils/ButtonPaginator";

export class ReactionRole extends Module {
    private static logger: Logger = Logger.getLogger(this);

    public constructor(bot: Bot) {
        super(bot);
    }

    @group("Reaction role management commands")
    @isMod()
    @guildOnly()
    public async reactionrole(ctx: CommandContext) {}

    //TODO refactor all of this copy and pasta
    @subcommand("reactionrole", "Adds a reaction role.")
    @isMod()
    @guildOnly()
    @args([
        {
            name: "link",
            type: "string",
            description: "Message link",
        },
        {
            name: "role",
            type: "role",
            description: "Role to add",
        },
        {
            name: "emote",
            type: "emoji",
            description: "Emote to use",
        },
    ])
    public async add(c: CommandContext<true>, link: string, role: Role, emote: EmojiResolvable) {
        await c.defer();
        let bot = c.bot;

        const msg = await ReactionRole.parseMessage(link, c);
        if (!msg) {
            return;
        }

        const emoteId = typeof emote === "string" ? emote : emote.identifier;

        const config = bot.db.reactionRoles.getReactionRole(msg, emoteId);
        if (config === null) {
            await c.reply(`Error checking database, please try again later.`, true);
            return;
        }
        if (config) {
            const emoji = await CommandUtils.makeEmoteFromId(config.emoteId);
            await c.reply(
                `Adding reaction role failed. Reaction role with emote ${emoji} already exists.`,
                true
            );
            return;
        }

        if (!(await ReactionRole.checkPerms(role, msg))) {
            return;
        }

        const dbResult = bot.db.reactionRoles.setReactionRole(msg, emoteId, role);
        if (!dbResult) {
            await c.reply("Adding reaction role failed.", true);
            return;
        }

        // React to message
        try {
            await msg.react(emote);
        } catch (err) {
            await c.reply(
                "Error reacting to message. Do I have perms? The reaction role is still registered.",
                true
            );
            await ReactionRole.logger.warning(
                // eslint-disable-next-line max-len
                `Error reacting to message ${msg.id} in channel ${msg.channel.id} in guild ${c.guild.id}`,
                err
            );
        }

        await c.reply('Reaction role added successfully');
    }

    @subcommand("reactionrole", "Removes a reaction role")
    @isMod()
    @guildOnly()
    @args([
        {
            name: "link",
            type: "string",
            description: "Message link",
        },
        {
            name: "role",
            type: "role",
            description: "Role to add",
        },
        {
            name: "emote",
            type: "emoji",
            description: "Emote to use",
        },
    ])
    public async remove(
        ctx: CommandContext<true>,
        link: string,
        role: Role,
        emote: EmojiResolvable
    ) {
        const reactionMessage = await ReactionRole.parseMessage(link, ctx);
        if (!reactionMessage) {
            return;
        }
        const emoteId = typeof emote === "string" ? emote : emote.identifier;
        const config = ctx.bot.db.reactionRoles.getReactionRole(reactionMessage, emoteId);

        if (config === null) {
            await ctx.reply("Error accessing db, please try again later.", true);
            return;
        }
        if (!config) {
            await ctx.reply("Error removing reaction role, it does not exist.", true);
            return;
        }

        const success: boolean = await this.removeReactionRole(reactionMessage, emoteId, ctx);
        if (success) {
            await ctx.reply("Reaction role removed successfully.", true);
        } else {
            await ctx.reply("Error removing reaction role.", true);
        }
    }

    @subcommand("reactionrole", "Lists current reaction roles")
    @isMod()
    @guildOnly()
    public async list(ctx: CommandContext<true>) {
        // Get reactionroles
        const reactionRoles = ctx.bot.db.reactionRoles.getReactionRolesByGuild(ctx.guild);

        if (reactionRoles === null) {
            await ctx.reply("Error accessing db, please try again later.", true);
            return;
        }
        if (!reactionRoles || reactionRoles.length < 1) {
            await ctx.reply("I have no current reaction roles.");
            return;
        }

        // List of strings
        const stringList: string[] = [];
        let currString: string;
        for (let reactionRole of reactionRoles) {
            let reactionChannel: TextBasedChannel;
            let reactionMessage: Message;

            currString = "";

            try {
                reactionChannel = <TextBasedChannel>(
                    await ctx.client.channels.fetch(reactionRole.channelId)
                );
                reactionMessage = await reactionChannel.messages.fetch(reactionRole.messageId);
                currString += `[Message](${reactionMessage.url}),`;
            } catch (err) {
                currString += `BROKEN: Channel: <#${reactionRole.channelId}>, Message: ${reactionRole.messageId},`;
            }

            currString += ` Emote: ${await CommandUtils.makeEmoteFromId(reactionRole.emoteId)},`;
            currString += ` Role: <@&${reactionRole.roleId}>`;
            stringList.push(currString);
        }

        // Make paginator
        const paginator: ButtonPaginator = new ButtonPaginator(
            stringList,
            ctx,
            10,
            "Reaction Roles",
        );

        await paginator.postMessage();
    }

    private async removeReactionRole(
        message: Message,
        emoteId: string,
        ctx: CommandContext
    ): Promise<boolean> {
        const result = ctx.bot.db.reactionRoles.removeReactionRole(
            message.channel.id,
            message.id,
            emoteId
        );

        if (!result) return false;

        // Remove our reaction
        const reaction: MessageReaction | undefined = await this.getReaction(message, emoteId);
        if (reaction) {
            try {
                await reaction.users.remove(message.client.user!);
            } catch (err) {
                await ctx.reply("Unexpected error occurred when removing reaction.", true);
                await this.logger.warning("Error removing reaction from message.", err);
            }
        }
        return true;
    }

    private async getReaction(
        message: Message,
        emoteId: string
    ): Promise<MessageReaction | undefined> {
        let reaction: MessageReaction | undefined;

        // Get reaction
        try {
            reaction = message.reactions.cache.get(emoteId);
            if (reaction?.partial) {
                reaction = await reaction.fetch();
            }
        } catch (err) {
            await this.logger.warning(
                // eslint-disable-next-line max-len
                `Error getting reaction ${emoteId} from message,channel,guild ${message.id}.${message.channelId},${message.guildId}`
            );
            reaction = undefined;
        }
        return reaction;
    }

    private static async parseMessage(
        link: string,
        ctx: CommandContext
    ): Promise<Message | undefined> {
        let reactionMessage: Message;

        // Parse message link
        const splitLink = link.split("/");
        if (splitLink.length < 7) {
            return undefined;
        }

        const linkGuildId: string = splitLink[4];
        const linkChannelId: string = splitLink[5];
        const linkMessageId: string = splitLink[6];

        if (linkGuildId !== ctx.guild!.id) {
            return undefined;
        }

        const channel = await CommandUtils.parseTextChannel(linkChannelId);
        if (!channel) {
            return undefined;
        }
        if (channel.type === "DM") {
            return undefined;
        }

        try {
            reactionMessage = await channel.messages.fetch(linkMessageId);
        } catch (err) {
            return undefined;
        }

        return reactionMessage;
    }

    private static async checkPerms(role: Role, reactionMessage: Message): Promise<boolean> {
        if (
            !role.guild.me ||
            !reactionMessage.guild?.me ||
            !(reactionMessage.channel as GuildChannelResolvable)
        ) {
            return false;
        }
        // Manage roles
        if (!role.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
            return false;
        }
        // If role below us
        if (role.comparePositionTo(role.guild.me.roles.highest) > 0) {
            return false;
        }
        // If we can't react in the channel
        if (
            !reactionMessage.guild.me
                .permissionsIn(reactionMessage.channel as GuildChannelResolvable)
                .has(Permissions.FLAGS.ADD_REACTIONS)
        ) {
            return false;
        }

        return true;
    }
}