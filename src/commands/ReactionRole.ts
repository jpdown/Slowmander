import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message, User, GuildMember, Role, TextChannel, NewsChannel, Channel, Emoji } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";

export class ReactionRole extends CommandGroup {
    constructor() {
        super("reactionrole", PermissionLevel.Owner, "Manages reaction roles", false);

        this.registerSubCommands();
    }

    protected registerSubCommands(): void {
        this.registerSubCommand(new AddReactionRole(this));
        this.registerSubCommand(new RemoveReactionRole(this));
    }
}

class AddReactionRole extends Command {
    constructor(group: CommandGroup) {
        super("add", PermissionLevel.Owner, "Adds a reaction role", "<channel> <messageID> <emote> <role> <name>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 5) {
            return {sendHelp: true, command: this, message: message};
        }

        let channel: TextChannel | NewsChannel;
        let reactionMessage: Message;
        let emote: Emoji;
        let role: Role;
        let name: string;

        try {
            channel = <TextChannel | NewsChannel> await CommandUtils.parseChannel(args[0], message.client);
            reactionMessage = await channel.messages.fetch(args[1]);
            emote = await CommandUtils.parseEmote(args[2], message.client);
            role = await CommandUtils.parseRole(args[3], channel.guild);
            name = args[4]
        }
        catch(err) {
            return {sendHelp: true, command: this, message: message};
        }

        if(channel === undefined || reactionMessage === undefined || emote === undefined || role === undefined) {
            return {sendHelp: true, command: this, message: message};
        }

        let success: boolean = await bot.reactionRoleManager.reactionRoleConfig.add(reactionMessage, emote, role, name);
        if(success) {
            await this.sendMessage(`Reaction role ${name} added successfully.`, message.channel);
        }
        else {
            await this.sendMessage("Error adding reaction role.", message.channel);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class RemoveReactionRole extends Command {
    constructor(group: CommandGroup) {
        super("remove", PermissionLevel.Owner, "Removes a reaction role", "<name>", false, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let name: string = args[0];

        let success: boolean = await bot.reactionRoleManager.reactionRoleConfig.remove(name, message.client);
        if(success) {
            await this.sendMessage(`Reaction role ${name} removed successfully.`, message.channel);
        }
        else {
            await this.sendMessage("Error removing reaction role.", message.channel);
        }

        return {sendHelp: false, command: this, message: message};
    }
}