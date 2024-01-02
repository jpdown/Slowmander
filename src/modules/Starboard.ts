import { Bot } from "Bot";
import { Module } from "./Module";
import { args, command, group, guildOnly, isMod, subcommand } from "./ModuleDecorators";
import { CommandContext } from "CommandContext";
import { Channel, Emoji, EmojiResolvable, Guild, GuildChannel, MessageEmbed } from "discord.js";
import { HelixChatChatter } from "@twurple/api";
import { CommandUtils } from "utils/CommandUtils";

export class Starboard extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @group("Starboard related commands")
    @isMod()
    @guildOnly()
    public async starboard(c: CommandContext) {}

    @subcommand("starboard", "Starboard config")
    @isMod()
    @guildOnly()
    @args([
        {
            name: "emote",
            type: "emoji",
            description: "Emote for pinning messages",
        },
        {
            name: "channel",
            type: "channel",
            description: "Channel for pinning messages",
        },
        {
            name: "number",
            type: "int",
            description: "Number of reactions required to pin",
        },
        {
            name: "enabled",
            type: "bool",
            description: "Whether starboard is enabled for this server",
        }
    ])
    public async config(c: CommandContext, emote: EmojiResolvable, channel: Channel, number: number, enabled: boolean) {
        // Verify that the channel is in this guild
        if (!channel.isText() || !(channel instanceof GuildChannel) || channel.guildId != c.guild!.id) {
            await c.reply("You must provide a text channel in this guild.", true);
            return;
        }

        const emoteId = typeof emote === "string" ? emote : emote.identifier;
        // Save config
        const dbResult = c.bot.db.starboard.setConfig(c.guild!.id, channel.id, emoteId, number, enabled);
        if (!dbResult) {
            await c.reply("Setting starboard config failed.", true);
            return;
        }

        await c.reply("Config updated.", true);
    }

    @subcommand("starboard", "Returns the configuration")
    @isMod()
    @guildOnly()
    public async status(c: CommandContext<true>) {
        const config = c.bot.db.starboard.getConfig(c.guild!.id);

        if (config == undefined) {
            await c.reply("There is no config for this guild.", true);
            return;
        }

        if (config == null) {
            await c.reply("There was an error getting the config.", true);
            return;
        }

        let emote = await CommandUtils.makeEmoteFromId(config.emoteId);
        if (!emote) {
            emote = config.emoteId;
        }

        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .addFields([
                { name: "Channel", value: `<#${config.channelId}>`},
                { name: "Emote", value: emote },
                { name: "Number of Reacts", value: config.numReacts.toString() },
                { name: "Enabled", value: config.enabled ? "Yes" : "No" },
            ])
            .setTitle("Starboard Configuration")

        await c.reply({ embeds: [embed] }, true);
    }

    @subcommand("starboard", "Manually pin a link")
    @isMod()
    @guildOnly()
    @args([
        {name: "message", type: "string", description: "The message link to pin"}
    ])
    public async pin(c: CommandContext, msg: string) {
        const message = await CommandUtils.parseMessageLink(msg);

        if (!message) {
            await c.reply("You must supply a valid message link", true);
            return;
        }

        if (!message.guild || message.guild.id !== c.guild!.id) {
            await c.reply("You must supply a message from this guild", true);
            return;
        }

        const config = c.bot.db.starboard.getConfig(c.guild!.id);

        if (!config) {
            await c.reply("Error getting starboard config", true);
            return;
        }

        const success = await c.bot.starboardManager.post(message, config);
        const response = success ? "Pinned successfully" : "Error pinning";
        await c.reply(response, true);
    }
}
