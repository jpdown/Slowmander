import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";
import { ReactionRoleObject } from "../config/ReactionRoleConfig";
import { ReactionPaginator } from "../utils/ReactionPaginator"

import { Message, Role, TextChannel, NewsChannel, Permissions, ReactionEmoji, Emoji, User, MessageReaction, Collection, ReactionCollector, GuildEmoji, Snowflake } from "discord.js";
import { CommandUtils } from "../utils/CommandUtils";

export class ReactionRoleManagement extends CommandGroup {
    constructor(bot: PantherBot) {
        super("reactionrole", "Manages reaction roles", bot, {runsInDm: false});

        this.registerSubCommands(bot);
    }

    protected registerSubCommands(bot: PantherBot): void {
        this.registerSubCommand(new AddReactionRole(this, bot));
        this.registerSubCommand(new RemoveReactionRole(this, bot));
        this.registerSubCommand(new ListReactionRoles(this, bot));
    }
}

class AddReactionRole extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("add", PermissionLevel.Admin, "Adds a reaction role", bot, {usage: "<message link> <role> <name>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 3) {
            return {sendHelp: true, command: this, message: message};
        }

        let reactionRoleParsedArgs: ReactionRoleParsedArgs = await this.parseArgs(args, message, bot);
        if(!reactionRoleParsedArgs) {
            return {sendHelp: false, command: this, message: message};
        }

        if(await bot.configs.reactionRoleConfig.guildHasReactionRoleName(message.guild.id, reactionRoleParsedArgs.name)) {
            await this.sendMessage(`Adding reaction role failed. Reaction role ${reactionRoleParsedArgs.name} already exists.`, message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Ask for emote
        let sentMessage: Message = await this.sendMessage("Please react on this message with the emote you would like to use.", message.channel, bot);
        let reactions: Collection<string, MessageReaction> = await sentMessage.awaitReactions((reaction, user) => user.id === message.author.id, {time:60000, max: 1});

        //Check if unicode or if we have the custom emote
        if(reactions.size < 1) {
            await this.sendMessage("No reaction given, cancelling.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let emote: ReactionEmoji | GuildEmoji = reactions.first().emoji;
        if(emote.id && emote instanceof ReactionEmoji) {
            await this.sendMessage("I do not have access to the emote given, cancelling.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //Create object
        let reactionRoleObject: ReactionRoleObject = {
            guildID: message.guild.id,
            channelID: reactionRoleParsedArgs.channel.id,
            messageID: reactionRoleParsedArgs.reactionMessage.id,
            emoteID: emote.identifier,
            roleID: reactionRoleParsedArgs.role.id,
            name: reactionRoleParsedArgs.name
        }

        if(await bot.configs.reactionRoleConfig.guildHasReactionRoleEmote(reactionRoleObject.guildID, reactionRoleObject.emoteID, reactionRoleObject.messageID)) {
            await this.sendMessage(`Adding reaction role failed. Reaction role with emote ${await ReactionRoleHelper.makeEmoteFromId(reactionRoleObject.emoteID, message)} already exists.`, message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        let success: boolean = await bot.reactionRoleManager.addReactionRole(reactionRoleObject, reactionRoleParsedArgs.reactionMessage);
        if(success) {
            await this.sendMessage(`Reaction role ${reactionRoleObject.name} added successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage("Error adding reaction role.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }

    private async parseArgs(args: string[], message: Message, bot: PantherBot): Promise<ReactionRoleParsedArgs> {
        let channel: TextChannel | NewsChannel;
        let reactionMessage: Message;
        let role: Role;
        let name: string;

        //Parse message link
        let splitLink = args[0].split("/");
        if(splitLink.length < 7) {
            await this.sendMessage("Adding reaction role failed. Invalid message link specified.", message.channel, bot);
            return(undefined);
        }

        let linkGuildId: string = splitLink[4];
        let linkChannelId: string = splitLink[5];
        let linkMessageId: string = splitLink[6];

        if(linkGuildId !== message.guild.id) {
            await this.sendMessage("Adding reaction role failed. The message link was for a message not in this guild.", message.channel, bot);
            return(undefined);
        }

        channel = <TextChannel | NewsChannel> await CommandUtils.parseChannel(linkChannelId, message.client);
        if(!channel) {
            await this.sendMessage("Adding reaction role failed. I couldn't find the channel.", message.channel, bot);
            return(undefined);
        }

        try {
            reactionMessage = await channel.messages.fetch(linkMessageId);
        }
        catch(err) {
            await this.sendMessage("Adding reaction role failed. I couldn't find the message.", message.channel, bot);
            return(undefined);
        }

        role = await CommandUtils.parseRole(args[1], channel.guild);
        if(!role) {
            await this.sendMessage("Adding reaction role failed. Invalid role specified.", message.channel, bot);
            return(undefined);
        }

        name = args[2]

        return({channel: channel, reactionMessage: reactionMessage, role: role, name: name});
    }
}

class RemoveReactionRole extends Command {
    constructor(group: CommandGroup, bot: PantherBot) {
        super("remove", PermissionLevel.Admin, "Removes a reaction role", bot, {usage: "<name>", runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR, aliases: ["del", "delete"]});
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(args.length < 1) {
            return {sendHelp: true, command: this, message: message};
        }

        let name: string = args[0];

        if(!await bot.configs.reactionRoleConfig.guildHasReactionRoleName(message.guild.id, name)) {
            await this.sendMessage(`Reaction role ${name} does not exist.`, message.channel, bot);
            return {sendHelp: false, command: this, message: message};
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
    constructor(group: CommandGroup, bot: PantherBot) {
        super("list", PermissionLevel.Admin, "Gets list of reaction roles", bot, {runsInDm: false, group: group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        //Get reactionroles
        let reactionRoles: ReactionRoleObject[] = await bot.configs.reactionRoleConfig.getGuildReactionRoles(message.guild.id);

        if(reactionRoles.length < 1) {
            await this.sendMessage("I have no current reaction roles.", message.channel, bot);
            return {sendHelp: false, command: this, message: message};
        }

        //List of strings
        let stringList: string[] = [];
        let currString: string;
        for(let reactionRole of reactionRoles) {
            let reactionChannel: TextChannel | NewsChannel;
            let reactionMessage: Message;

            currString = `\`${reactionRole.name}\` - `;

            try {
                reactionChannel = <TextChannel | NewsChannel> await message.client.channels.fetch(reactionRole.channelID);
                reactionMessage = await reactionChannel.messages.fetch(reactionRole.messageID);
                currString += `[Message](${reactionMessage.url}),`;
            }
            catch(err) {
                currString += `BROKEN: Channel: <#${reactionRole.channelID}>, Message: ${reactionRole.messageID},`;
            }

            currString += ` Emote: ${await ReactionRoleHelper.makeEmoteFromId(reactionRole.emoteID, message)},`
            currString += ` Role: <@&${reactionRole.roleID}>`;
            stringList.push(currString);
        }

        //Make paginator
        let paginator: ReactionPaginator = new ReactionPaginator(stringList, 10, 
            "Reaction Roles", message.channel, bot, this);

        let paginatedMessage = await paginator.postMessage();

        return {sendHelp: false, command: this, message: message};
    }
}

class ReactionRoleHelper {
    public static async makeEmoteFromId(emoteId: string, message: Message): Promise<string> {
        let emote: string;

        try {
            emoteId = emoteId.split(":").pop();
            emote = message.client.emojis.resolve(emoteId).toString();
        }
        catch(err) {
            if(emoteId.indexOf(":") === -1) {
                emote = decodeURI(emoteId);
            }
            else {
                emote = emoteId;
            }
        }

        return(emote);
    }
}

export interface ReactionRoleParsedArgs {
    channel: TextChannel | NewsChannel,
    reactionMessage: Message,
    role: Role,
    name: string
}