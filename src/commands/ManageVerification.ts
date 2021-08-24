import {Command, PermissionLevel, CommandResult} from 'commands/Command';
import { PantherBot } from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';
import { CommandGroup } from 'commands/CommandGroup';
import { VerificationConfigObject } from 'config/VerificationConfig';

import {Message, MessageEmbed, Permissions, Role, GuildEmoji, ReactionEmoji, TextBasedChannels, GuildMember} from 'discord.js';

export class ManageVerification extends CommandGroup {
    constructor(bot: PantherBot) {
        super("verification", "Manages lockdown presets", bot, {runsInDm: false});

        this.registerSubCommands(bot);
    }

    protected registerSubCommands(bot: PantherBot): void {
        this.registerSubCommand(new EnableVerification(this, bot));
        this.registerSubCommand(new DisableVerification(this, bot));
        this.registerSubCommand(new SetVerification(this, bot));
        this.registerSubCommand(new VerificationStatus(this, bot));
    }
}

class EnableVerification extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("enable", PermissionLevel.Admin, "Enables verification", bot, {group: group, runsInDm: false, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        //Check if we have a valid config before enabling
        let verificationConfig: VerificationConfigObject | undefined = await bot.configs.verificationConfig.getVerificationConfig(message.guild!.id);
        if(!verificationConfig) {
            await CommandUtils.sendMessage("No config found, please set the config first.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let result = await bot.configs.guildConfig.setVerificationEnabled(message.guild!.id, true);
        if(result) {
            await CommandUtils.sendMessage("Verification successfully enabled.", message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage("Error enabling verification.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class DisableVerification extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("disable", PermissionLevel.Admin, "Disables verification", bot, {group: group, runsInDm: false, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let result = await bot.configs.guildConfig.setVerificationEnabled(message.guild!.id, false);
        if(result) {
            await CommandUtils.sendMessage("Verification successfully disabled.", message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage("Error disabling verification.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class SetVerification extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("set", PermissionLevel.Admin, "Sets verification options", bot, {usage: "<channel> <role> <remove reaction true/false>", group: group, runsInDm: false, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 3) {
            return {sendHelp: true, command: this, message: message};
        }

        //Parse input
        let channel: TextBasedChannels | undefined = await CommandUtils.parseTextChannel(args[0], message.client);
        if(!channel || channel.type === "DM" || channel.guild.id != message.guild!.id) {
            await CommandUtils.sendMessage("Invalid channel specified, verification config not saved.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }
        //Check perms
        let member: GuildMember = channel.guild.members.cache.get(bot.client.user!.id)!;
        if(!channel.permissionsFor(member).has(Permissions.FLAGS.SEND_MESSAGES)) {
            await CommandUtils.sendMessage("I do not have permissions to send a message in specified channel, verification config not saved.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let role: Role | undefined = await CommandUtils.parseRole(args[1], message.guild!);
        if(!role) {
            await CommandUtils.sendMessage("Invalid role specified, verification config not saved.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let removeReaction: boolean = args[2].toLowerCase().startsWith("t");

        //Check if we already have a config, if so we don't need a new message
        let newMessage: boolean = true;
        let config: VerificationConfigObject | undefined = await bot.configs.verificationConfig.getVerificationConfig(message.guild!.id);
        if(config && config.channelID === channel.id) {
            newMessage = false;
        }

        //Get emote to listen for
        let emote: GuildEmoji | ReactionEmoji | undefined = await CommandUtils.getEmote(message, bot);
        if(!emote) {
            return {sendHelp: false, command: this, message: message};
        }

        //Post message
        let verificationMessage = await CommandUtils.sendMessage("Please react to this message to gain access to the rest of the server.", channel, bot);

        //React if we're not removing reactions
        if(!removeReaction) {
            await verificationMessage.react(emote);
        }

        //Save verification config
        let saveResult: boolean = await bot.configs.verificationConfig.setVerificationConfig(message.guild!.id, channel.id, verificationMessage.id, emote.identifier, role.id, removeReaction)
        if(saveResult) {
            await CommandUtils.sendMessage("Verification config saved successfully, please enable it if not already enabled.", message.channel, bot);
        }
        else {
            await CommandUtils.sendMessage("Error saving verification config.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class VerificationStatus extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("status", PermissionLevel.Mod, "Gives verification status", bot, {group: group, runsInDm: false, requiredPerm: Permissions.FLAGS.ADMINISTRATOR, aliases: ["info"]})
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let verificationConfig: VerificationConfigObject | undefined = await bot.configs.verificationConfig.getVerificationConfig(message.guild!.id);
        if(!verificationConfig) {
            await CommandUtils.sendMessage("No config found, please set one first.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let embed: MessageEmbed = new MessageEmbed()
            .addField("Status", await bot.configs.guildConfig.getVerificationEnabled(message.guild!.id) ? "Enabled" : "Disabled", true)
            .addField("Channel", `<#${verificationConfig.channelID}>`, true)
            .addField("Emote", await CommandUtils.makeEmoteFromId(verificationConfig.emoteID, message) ?? "Invalid", true)
            .addField("Role", `<@&${verificationConfig.roleID}>`, true)
            .setTitle("Verification Status in " + message.guild!.name)
            .setColor(await CommandUtils.getSelfColor(message.channel, bot));
        
        await message.channel.send({embeds: [embed]});

        return {sendHelp: false, command: this, message: message};
    }
}