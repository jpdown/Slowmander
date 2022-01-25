import { Bot } from "Bot";
import { CommandContext } from "CommandContext";
import { Collection, GuildChannelResolvable, GuildEmoji, Message, MessageReaction, Role } from "discord.js";
import { APIMessage } from "discord-api-types/v9";
import { ReactionEmoji } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command, isMod } from "./ModuleDecorators";
import { Permissions } from "discord.js";
import { Logger } from "Logger";

export class ReactionRole extends Module {
    private static logger: Logger = Logger.getLogger(this);

    public constructor(bot: Bot) {
        super(bot);
    }

    //TODO refactor all of this copy and pasta
    @command("Adds a reaction role.")
    @isMod()
    @args([
        {
            name: "link",
            type: "string",
            description: "Message link"
        },
        {
            name: "role",
            type: "string",
            description: "Role to add",
            autocomplete: true,
            autocompleteFunc: ReactionRole.getRoles,
        },
    ])
    public async addrole(c: CommandContext<true>, link: string, role: string) {
        await c.defer();
        let bot = c.bot;
        let args: string[] = [link, role];
        if (args.length < 2) {
            await c.reply("Missing arguments!");
            return;
        }

        const parsedArgs = await ReactionRole.parseArgs(args, c);
        if (!parsedArgs) {
            return;
        }
        let msg = parsedArgs.reactionMessage;

        const emote: ReactionEmoji | GuildEmoji | undefined = await ReactionRole.getEmote(c);
        if (!emote) {
            return;
        }

        const config = bot.db.reactionRoles.getReactionRole(msg, emote.identifier);
        if (config === null) {
            await c.reply({content: `Error checking database, please try again later.`, ephemeral: true})
            return;
        }
        if (config) {
            const emoji = await CommandUtils.makeEmoteFromId(config.emoteId);
            await c.reply({content: `Adding reaction role failed. Reaction role with emote ${emoji} already exists.`, ephemeral: true})
            return;
        }

        if (
            !(await ReactionRole.checkPerms(
                parsedArgs.role,
                parsedArgs.reactionMessage,
            ))
        ) {
            return;
        }

        const dbResult = bot.db.reactionRoles.setReactionRole(
            parsedArgs.reactionMessage,
            emote.identifier,
            parsedArgs.role
        );
        if (!dbResult) {
            await c.reply({content: "Adding reaction role failed.", ephemeral: true})
            return;
        }

        // React to message
        try {
            await parsedArgs.reactionMessage.react(emote);
        } catch (err) {
            await c.reply({content: "Error reacting to message. Do I have perms? The reaction role is still registered.", ephemeral: true})
            await ReactionRole.logger.warning(
                // eslint-disable-next-line max-len
                `Error reacting to message ${parsedArgs.reactionMessage.id} in channel ${parsedArgs.reactionMessage.channel.id} in guild ${parsedArgs.reactionMessage.guild?.id}`,
                err
            );
        }
    }

    // TODO this is temp
    private static async getEmote(message: CommandContext): Promise<ReactionEmoji | GuildEmoji | undefined> {
        // Ask for emote
        const sentMessage: APIMessage | Message | undefined = await message.reply("Please react on this message with the emote you would like to use.");
        if (!sentMessage) {
            this.logger.error("Error with getting emote");
            return undefined;
        }
        if (!(sentMessage instanceof Message)) {
            this.logger.error("Error with getting emote")
            return undefined;
        }
        const reactions: Collection<string, MessageReaction> =
            await sentMessage.awaitReactions({
                filter: (reaction, user) => user.id === message.user.id,
                time: 60000,
                max: 1,
            });

        // Check if unicode or if we have the custom emote
        if (reactions.size < 1) {
            await message.reply(
                "No reaction given, cancelling.",
            );
            return undefined;
        }

        let emote: ReactionEmoji | GuildEmoji | undefined =
            reactions.first()?.emoji;
        if (emote?.id && emote instanceof ReactionEmoji) {
            await message.reply("I do not have access to the emote given, cancelling.");
            emote = undefined;
        }

        return emote;
    }

    private static async getRoles(id: string | null, bot: Bot): Promise<string[]> {
        if (id) {
            let g = bot.client.guilds.cache.get(id);
            if (!g) return [];
            let ret: string[] = [];
            g.roles.cache.forEach((r) => {
                if (g && g.me) {
                    if (r.comparePositionTo(g.me.roles.highest) < 0) {
                        ret.push(r.name);
                    }
                }
            });
            return ret;
        }
        return [];
    }

    private static async parseArgs(args: string[], message: CommandContext): Promise<ReactionRoleParsedArgs | undefined> {
        let reactionMessage: Message;

        // Parse message link
        const splitLink = args[0].split("/");
        if (splitLink.length < 7) {
            return undefined;
        }

        const linkGuildId: string = splitLink[4];
        const linkChannelId: string = splitLink[5];
        const linkMessageId: string = splitLink[6];

        if (linkGuildId !== message.guild!.id) {
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

        const role = await CommandUtils.parseRole(args[1], channel.guild);
        if (!role) {
            return undefined;
        }

        return {
            reactionMessage,
            role,
        };
    }

    private static async checkPerms(
        role: Role,
        reactionMessage: Message,
    ): Promise<boolean> {
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

type ReactionRoleParsedArgs = {
    role: Role;
    reactionMessage: Message;
};
