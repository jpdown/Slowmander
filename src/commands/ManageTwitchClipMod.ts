import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';

import {Message, Permissions, MessageEmbed} from 'discord.js';
import { CommandUtils } from '../utils/CommandUtils';
import { CommandGroup } from './CommandGroup';

export class ManageTwitchClipMod extends CommandGroup {
    constructor(bot: PantherBot) {
        super("twitchclip", "Manages Twitch Clip moderation", bot, {runsInDm: false});

        this.registerSubCommands(bot);
    }

    protected registerSubCommands(bot: PantherBot): void {
        this.registerSubCommand(new EnableClipModeration(this, bot))
        this.registerSubCommand(new DisableClipModeration(this, bot))
        this.registerSubCommand(new AddTwitchChannel(this, bot))
        this.registerSubCommand(new DeleteTwitchChannel(this, bot))
        this.registerSubCommand(new ChannelModInfo(this, bot))
    }
}

class EnableClipModeration extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("enable", PermissionLevel.Admin, "Enables Twitch clip moderation settings for a channel", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {

    }
}

class DisableClipModeration extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("disable", PermissionLevel.Admin, "Disables Twitch clip moderation settings for a channel", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {

    }
}

class AddTwitchChannel extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("addchannel", PermissionLevel.Admin, "Adds a Twitch channel to approved channels", bot, {usage: "<channel> <twitch channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {

    }
}

class DeleteTwitchChannel extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("delchannel", PermissionLevel.Admin, "Deletes a Twitch channel from approved channels", bot, {usage: "<channel> <twitch channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {

    }
}

class ChannelModInfo extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("info", PermissionLevel.Admin, "Gives info about clip moderation in a channel", bot, {usage: "<channel>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR})
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {

    }
}