import {Module} from "./Module";
import {Bot} from "../Bot";
import {args, group, guildOnly, isMod, permissions, subcommand} from "./ModuleDecorators";
import {CommandContext} from "../CommandContext";
import {CommandUtils} from "../utils/CommandUtils";
import {
    Channel,
    Collection,
    EmojiResolvable,
    GuildChannel,
    GuildEmoji,
    GuildMember,
    Message, MessageEmbed,
    MessageReaction,
    Permissions,
    ReactionEmoji,
    Role
} from "discord.js";
import {APIMessage} from "discord-api-types/v10";

export class ManageVerification extends Module {
    constructor(b: Bot) {
        super(b);
    }

    @group("Moderator commands for editing server verification")
    @permissions(['MANAGE_ROLES'])
    @guildOnly()
    public async verification() {}

    @subcommand("verification", "Enable server verification")
    @guildOnly()
    public async enable(ctx: CommandContext) {
        let bot = ctx.bot;
        // Check if we have a valid config before enabling
        const verificationConfig = bot.db.verification.getConfig(ctx.guild!.id);
        if (!verificationConfig) {
            await ctx.reply('No config found, please set the config first.');
            return;
        }

        const result = bot.db.verification.enable(ctx.guild!.id);
        if (result) {
            await ctx.reply('Verification successfully enabled.');
        } else {
            await ctx.reply('Error enabling verification.');
        }
    }

    @subcommand("verification", "Enable server verification")
    @guildOnly()
    public async disable(ctx: CommandContext) {
        let bot = ctx.bot;
        // Check if we have a valid config before enabling
        const verificationConfig = bot.db.verification.getConfig(ctx.guild!.id);
        if (!verificationConfig) {
            await ctx.reply('No config found, please set the config first.');
            return;
        }

        const result = bot.db.verification.disable(ctx.guild!.id);
        if (result) {
            await ctx.reply('Verification successfully enabled.');
        } else {
            await ctx.reply('Error enabling verification.');
        }
    }

    @subcommand("verification", "Enable server verification")
    @guildOnly()
    public async enableremove(ctx: CommandContext) {
        let bot = ctx.bot;
        // Check if we have a valid config before enabling
        const verificationConfig = bot.db.verification.getConfig(ctx.guild!.id);
        if (verificationConfig === null) {
            await ctx.reply('Error getting from db, please try again later.');
            return;
        }
        if (verificationConfig === undefined) {
            await ctx.reply('No config found, please set the config first.');
            return;
        }

        const result = bot.db.verification.enableRemoveReaction(ctx.guild!.id);
        if (result) {
            await ctx.reply('Remove reaction successfully enabled.');
        } else {
            await ctx.reply('Error enabling remove reaction.');
        }
    }

    @subcommand("verification", "Enable server verification")
    @guildOnly()
    public async disableremove(ctx: CommandContext) {
        let bot = ctx.bot;
        // Check if we have a valid config before enabling
        const verificationConfig = bot.db.verification.getConfig(ctx.guild!.id);
        if (verificationConfig === null) {
            await ctx.reply('Error getting from db, please try again later.');
            return;
        }
        if (verificationConfig === undefined) {
            await ctx.reply('No config found, please set the config first.');
            return;
        }

        const result = bot.db.verification.disableRemoveReaction(ctx.guild!.id);
        if (result) {
            await ctx.reply('Remove reaction successfully enabled.');
        } else {
            await ctx.reply('Error enabling remove reaction.');
        }
    }

    @subcommand("verification", "Enable server verification")
    @args([
        {
            name: "channel",
            description: "description",
            type: "channel"
        },
        {
            name: "role",
            description: "description",
            type: "role"
        },
        {
            name: "emote",
            description: "The emote to use",
            type: "emoji"
        }
    ])
    @guildOnly()
    public async set(ctx: CommandContext, c: Channel, r: Role, e: EmojiResolvable) {
        let bot = ctx.bot;

        if (
            !c.isText() ||
            !(c instanceof GuildChannel) ||
            !(c.guild.id === c.guild.id)
        ) {
            await ctx.reply("Given channel is not a a text channel in this guild.");
            return;
        }
        // Check perms
        const member: GuildMember = c.guild.members.cache.get(bot.client.user!.id)!;
        if (!c.permissionsFor(member).has(Permissions.FLAGS.SEND_MESSAGES)) {
            await ctx.reply('I do not have permissions to send a message in specified channel, verification config not saved.');
            return;
        }

        // Check if we already have a config, if so we don't need a new message
        let messageId: string;
        let verificationMessage: Message | APIMessage | undefined;
        const config = bot.db.verification.getConfig(ctx.guild!.id);
        if (config === null) {
            await ctx.reply('Error saving verification config.');
            return;
        }
        if (config && config.channelId === c.id) {
            try {
                messageId = config.messageId;
                verificationMessage = await (await CommandUtils.parseTextChannel(config.channelId))?.messages.fetch(messageId);
            } catch (e) { }
        }
        if (!verificationMessage) {
            verificationMessage = await c.send({
                embeds: [
                    await CommandUtils.generateEmbed(
                        "Please react to this message to gain access to the rest of the server.",
                        c, false
                    ),
                ],
            });
        }
        const emoteId = typeof e === "string" ? e : e.identifier;

        // Save verification config
        const saveResult = bot.db.verification.setConfig(verificationMessage as Message, r, emoteId);
        if (saveResult) {
            await ctx.reply('Verification config saved successfully, please enable it if not already enabled.');
        } else {
            await ctx.reply('Error saving verification config.');
        }
    }

    @subcommand("verification", "Enable server verification")
    @guildOnly()
    public async status(ctx: CommandContext) {
        let bot = ctx.bot;
        const verificationConfig = bot.db.verification.getConfig(ctx.guild!.id);
        if (verificationConfig === null) {
            await ctx.reply('Error getting from db, please try again later.');
            return;
        }
        if (verificationConfig === undefined) {
            await ctx.reply('No config found, please set the config first.');
            return;
        }

        const embed: MessageEmbed = new MessageEmbed()
            .addField('Status', verificationConfig.enabled ? 'Enabled' : 'Disabled', true)
            .addField('Channel', `<#${verificationConfig.channelId}>`, true)
            .addField('Emote', await CommandUtils.makeEmoteFromId(verificationConfig.emoteId) ?? 'Invalid', true)
            .addField('Role', `<@&${verificationConfig.roleId}>`, true)
            .setTitle(`Verification Status in ${ctx.guild!.name}`)
            .setColor(await CommandUtils.getSelfColor(ctx.channel));

        await ctx.reply({ embeds: [embed] });
    }

    // TODO this is temp
    private async getEmote(message: CommandContext): Promise<ReactionEmoji | GuildEmoji | undefined> {
        // Ask for emote
        const sentMessage: APIMessage | Message | undefined = await message.reply("Please react on this message with the emote you would like to use.");
        if (!sentMessage) {
            await this.logger.error("Error with getting emote");
            return undefined;
        }
        if (!(sentMessage instanceof Message)) {
            await this.logger.error("Error with getting emote")
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
}