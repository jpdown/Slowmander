import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";
import { ReactionRole } from "../reactionroles/ReactionRoleConfig";
import { ReactionPaginator } from "../utils/ReactionPaginator"

import { Message, User, GuildMember, Role, TextChannel, NewsChannel, Channel, Emoji, Permissions } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";

export class ReactionRoleManagement extends CommandGroup {
    constructor() {
        super("reactionrole", PermissionLevel.Owner, "Manages reaction roles", {runsInDm: false});

        this.registerSubCommands();
    }

    protected registerSubCommands(): void {
        this.registerSubCommand(new AddReactionRole(this));
        this.registerSubCommand(new RemoveReactionRole(this));
        this.registerSubCommand(new ListReactionRoles(this));
    }
}

class AddReactionRole extends Command {
    constructor(group: CommandGroup) {
        super("add", PermissionLevel.Admin, "Adds a reaction role", {usage: "<channel> <messageID> <emote> <role> <name>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
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
            await this.sendMessage(`Reaction role ${name} added successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage("Error adding reaction role.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class RemoveReactionRole extends Command {
    constructor(group: CommandGroup) {
        super("remove", PermissionLevel.Admin, "Removes a reaction role", {usage: "<name>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let name: string = args[0];

        let success: boolean = await bot.reactionRoleManager.reactionRoleConfig.remove(name, message.client);
        if(success) {
            await this.sendMessage(`Reaction role ${name} removed successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage("Error removing reaction role.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }
}

class ListReactionRoles extends Command {
    constructor(group: CommandGroup) {
        super("list", PermissionLevel.Admin, "Gets list of reaction roles", {runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        //Get reactionroles
        let reactionRoles: ReactionRole[] = await bot.reactionRoleManager.reactionRoleConfig.getAll();

        if(reactionRoles.length < 1) {
            await this.sendMessage("I have no current reaction roles.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //List of strings
        let stringList: string[] = [];
        let currString: string;
        for(let reactionRole of reactionRoles) {
            currString = `\`${reactionRole.name}\` - <#${reactionRole.channelID}>, Message: ${reactionRole.messageID},`;
            currString += ` Emote: ${message.client.emojis.resolve(reactionRole.emoteID).toString()}`;
            stringList.push(currString);
        }

        //Make paginator
        let paginator: ReactionPaginator = new ReactionPaginator(stringList, 10, 
            "Reaction Roles", message.channel, bot, this);

        let paginatedMessage = await paginator.postMessage();

        return {sendHelp: false, command: this, message: message};
    }
}