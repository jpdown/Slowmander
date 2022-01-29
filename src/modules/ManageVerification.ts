import {Module} from "./Module";
import {Bot} from "../Bot";
import {group, isMod, subcommand} from "./ModuleDecorators";
import {CommandContext} from "../CommandContext";
import {CommandUtils} from "../utils/CommandUtils";
import {
    Collection,
    GuildEmoji,
    GuildMember,
    Message, MessageEmbed,
    MessageReaction,
    Permissions,
    ReactionEmoji,
    Role
} from "discord.js";
import {APIMessage} from "discord-api-types";
import {Logger} from "../Logger";

export class ManageVerification extends Module {
    private static logger: Logger = Logger.getLogger(this);

    constructor(b: Bot) {
        super(b);
    }

    @group("Moderator commands for editing server verification")
    @isMod()
    public static async verification() {}

    @subcommand("verification", "Enable server verification")
    public static async enable(ctx: CommandContext) {
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
    public static async disable(ctx: CommandContext) {
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
    public static async enableremove(ctx: CommandContext) {
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
    public static async disableremove(ctx: CommandContext) {
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
    public static async set(ctx: CommandContext, c: string, r: string) {
        let args = [c, r];
        let bot = ctx.bot;
        if (args.length < 2) {
            return;
        }

        // Parse input
        const channel = await CommandUtils.parseTextChannel(args[0]);
        if (!channel || channel.type === 'DM' || channel.guild.id !== ctx.guild!.id) {
            await ctx.reply('Invalid channel specified, verification config not saved.');
            return;
        }
        // Check perms
        const member: GuildMember = channel.guild.members.cache.get(bot.client.user!.id)!;
        if (!channel.permissionsFor(member).has(Permissions.FLAGS.SEND_MESSAGES)) {
            await ctx.reply('I do not have permissions to send a message in specified channel, verification config not saved.');
            return;
        }

        const role: Role | null = await CommandUtils.parseRole(args[1], ctx.guild!);
        if (!role) {
            await ctx.reply('Invalid role specified, verification config not saved.');
            return;
        }

        // Get emote to listen for
        const emote: GuildEmoji | ReactionEmoji | undefined = await ManageVerification.getEmote(ctx);
        if (!emote) {
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
        if (config && config.channelId === channel.id) {
            messageId = config.messageId;
            verificationMessage = await (await CommandUtils.parseTextChannel(config.channelId))?.messages.fetch(messageId);
        }
        if (!verificationMessage) {
            verificationMessage = await ctx.reply('Please react to this message to gain access to the rest of the server.');
        }

        // Save verification config
        const saveResult = bot.db.verification.setConfig(verificationMessage as Message, role, emote.identifier);
        if (saveResult) {
            await ctx.reply('Verification config saved successfully, please enable it if not already enabled.');
        } else {
            await ctx.reply('Error saving verification config.');
        }
    }

    @subcommand("verification", "Enable server verification")
    public static async status(ctx: CommandContext) {
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
    private static async getEmote(message: CommandContext): Promise<ReactionEmoji | GuildEmoji | undefined> {
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