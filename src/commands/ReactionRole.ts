import { CommandGroup } from "./CommandGroup";
import { Command, CommandResult } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";
import { ReactionRoleObject } from "../config/ReactionRoleConfig";
import { ReactionPaginator } from "../utils/ReactionPaginator"

import { Message, Role, TextChannel, NewsChannel, Permissions, ReactionEmoji, Emoji, User, MessageReaction, Collection, ReactionCollector, GuildEmoji, Snowflake, Guild } from "discord.js";
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

        if (!await this.checkPerms(reactionRoleParsedArgs.role, reactionRoleParsedArgs.reactionMessage, message, bot)) {
            return {sendHelp: false, command: this, message: message};
        }

        let emote: ReactionEmoji | GuildEmoji = await this.getEmote(message, bot);
        if(!emote) {
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

        let success: boolean = await this.addReactionRole(reactionRoleObject, reactionRoleParsedArgs.reactionMessage, message, bot);
        if(success) {
            await this.sendMessage(`Reaction role ${reactionRoleObject.name} added successfully.`, message.channel, bot);
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

    private async getEmote(message: Message, bot: PantherBot): Promise<ReactionEmoji | GuildEmoji> {
        //Ask for emote
        let sentMessage: Message = await this.sendMessage("Please react on this message with the emote you would like to use.", message.channel, bot);
        let reactions: Collection<string, MessageReaction> = await sentMessage.awaitReactions((reaction, user) => user.id === message.author.id, {time:60000, max: 1});

        //Check if unicode or if we have the custom emote
        if(reactions.size < 1) {
            await this.sendMessage("No reaction given, cancelling.", message.channel, bot);
            return undefined;
        }

        let emote: ReactionEmoji | GuildEmoji = reactions.first().emoji;
        if(emote.id && emote instanceof ReactionEmoji) {
            await this.sendMessage("I do not have access to the emote given, cancelling.", message.channel, bot);
        }

        return(emote);
    }

    private async checkPerms(role: Role, reactionMessage: Message, message: Message, bot: PantherBot): Promise<boolean> {
        //Manage roles
        if(!role.guild.me.hasPermission(Permissions.FLAGS.MANAGE_ROLES)) {
            await this.sendMessage("Adding reaction role failed. I do not have the Manage Roles permission.", message.channel, bot);
            return false;
        }
        //If role below us
        if(role.comparePositionTo(role.guild.me.roles.highest) > 0) {
            await this.sendMessage("Adding reaction role failed. Invalid hierarchy, my highest role is below the given role.", message.channel, bot);
            return false;
        }
        //If we can't react in the channel
        if(!reactionMessage.guild.me.permissionsIn(reactionMessage.channel).has(Permissions.FLAGS.ADD_REACTIONS)) {
            await this.sendMessage(`Adding reaction role failed. I do not have reaction perms in ${reactionMessage.channel.toString()}`, message.channel, bot);
            return false;
        }

        return true;
    }

    private async addReactionRole(reactionRole: ReactionRoleObject, reactionMessage: Message, message: Message, bot: PantherBot): Promise<boolean> {
        let dbResult: boolean = await bot.configs.reactionRoleConfig.addReactionRole(reactionRole);
        if(!dbResult) {
            await this.sendMessage("Adding reaction role failed.", message.channel, bot);
            return(false);
        }

        //React to message
        try {
            await reactionMessage.react(reactionRole.emoteID);
            return(true);
        }
        catch(err) {
            await this.sendMessage("Adding reaction role failed. Unexpected error while reacting to message.", message.channel, bot);
            await this.logger.warning(`Error reacting to message ${reactionMessage.id} in channel ${reactionMessage.channel.id} in guild ${reactionMessage.guild.id}`, err);
            await bot.configs.reactionRoleConfig.removeReactionRole(reactionRole.guildID, reactionRole.name);
            return(false);
        }
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

        let success: boolean = await this.removeReactionRole(message.guild.id, name, message, bot);
        if(success) {
            await this.sendMessage(`Reaction role ${name} removed successfully.`, message.channel, bot);
        }
        else {
            await this.sendMessage("Error removing reaction role.", message.channel, bot);
        }

        return {sendHelp: false, command: this, message: message};
    }

    private async removeReactionRole(guildId: Snowflake, name: string, message: Message, bot: PantherBot): Promise<boolean> {
        let removedReactionRole: ReactionRoleObject = await bot.configs.reactionRoleConfig.removeReactionRole(guildId, name);

        if(!removedReactionRole) return(false);

        //Remove our reaction
        let reaction: MessageReaction = await this.getReaction(removedReactionRole, bot);
        if(reaction) {
            try {
                await reaction.users.remove(message.client.user);
            }
            catch(err) {
                await this.sendMessage("Unexpected error occurred when removing reaction.", message.channel, bot);
                await this.logger.warning("Error removing reaction from message.", err);
            }
        }
        return(true);
    }

    private async getReaction(reactionRole: ReactionRoleObject, bot: PantherBot): Promise<MessageReaction> {
        let channel: TextChannel | NewsChannel;
        let reactionMessage: Message;
        let reaction: MessageReaction;

        //Get channel
        try {
            channel = <TextChannel | NewsChannel> await bot.client.channels.fetch(reactionRole.channelID);
        }
        catch(err) {
            return(undefined);
        }
        //Get message
        try {
            reactionMessage = await channel.messages.fetch(reactionRole.messageID);
        }
        catch(err) {
            return(undefined);
        }
        //Get reaction
        try {
            reaction = reactionMessage.reactions.cache.get(reactionRole.emoteID);
            if(reaction.partial) {
                reaction = await reaction.fetch();
            }
        }
        catch(err) {
            await this.logger.warning(`Error getting reaction ${reactionRole.name} ${reactionRole.emoteID} from message,channel,guild ${reactionRole.messageID}.${reactionRole.channelID},${reactionRole.guildID}`);
            reaction = undefined;
        }
        return(reaction);
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