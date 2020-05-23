import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";
import { ReactionRoleConfig, ReactionRoleObject } from "../config/ReactionRoleConfig";
import { ReactionPaginator } from "../utils/ReactionPaginator"

import { Message, User, GuildMember, Role, TextChannel, NewsChannel, Channel, Emoji, Permissions } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";

export class ReactionRoleManagement extends CommandGroup {
    constructor() {
        super("reactionrole", "Manages reaction roles", {runsInDm: false});

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

        if(await bot.reactionRoleManager.reactionRoleConfig.guildHasReactionRole(reactionMessage.guild.id, name)) {
            await this.sendMessage(`Reaction role ${name} already exists.`, message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let reactionRoleObject: ReactionRoleObject = {
            guildID: reactionMessage.guild.id,
            channelID: channel.id,
            messageID: reactionMessage.id,
            emoteID: emote.id,
            roleID: role.id,
            name: name
        }

        let success: boolean = await bot.reactionRoleManager.addReactionRole(reactionRoleObject, reactionMessage);
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

        if(!await bot.reactionRoleManager.reactionRoleConfig.guildHasReactionRole(message.guild.id, name)) {
            await this.sendMessage(`Reaction role ${name} does not exist.`, message.channel, bot);
            return;
        }

        let success: boolean = await bot.reactionRoleManager.removeReactionRole(message.guild.id, name, message.client);
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
        let reactionRoles: ReactionRoleObject[] = await bot.reactionRoleManager.reactionRoleConfig.getGuildReactionRoles(message.guild.id);

        if(reactionRoles.length < 1) {
            await this.sendMessage("I have no current reaction roles.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //List of strings
        let stringList: string[] = [];
        let currString: string;
        for(let reactionRole of reactionRoles) {
            currString = `\`${reactionRole.name}\` - <#${reactionRole.channelID}>, Message: ${reactionRole.messageID},`;
            currString += ` Emote: ${message.client.emojis.resolve(reactionRole.emoteID).toString()}, Role: <@&${reactionRole.roleID}>`;
            stringList.push(currString);
        }

        //Make paginator
        let paginator: ReactionPaginator = new ReactionPaginator(stringList, 10, 
            "Reaction Roles", message.channel, bot, this);

        let paginatedMessage = await paginator.postMessage();

        return {sendHelp: false, command: this, message: message};
    }
}