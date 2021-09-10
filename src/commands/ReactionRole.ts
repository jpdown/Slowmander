// /* eslint-disable max-classes-per-file */
// import { CommandGroup } from 'commands/CommandGroup';
// import { Command, CommandResult, PermissionLevel } from 'commands/Command';
// import type { Bot } from 'Bot';
// import { ReactionPaginator } from 'utils/ReactionPaginator';
// import { CommandUtils } from 'utils/CommandUtils';

// import {
//   Message, Role, TextChannel, NewsChannel, Permissions, ReactionEmoji,
//   MessageReaction, GuildEmoji, GuildChannelResolvable,
// } from 'discord.js';

// class AddReactionRole extends Command {
//   constructor(group: CommandGroup, bot: Bot) {
//     super('add', PermissionLevel.Admin, 'Adds a reaction role', bot, {
//       usage: '<message link> <role>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
//     });
//   }

//   public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
//     if (args.length < 2) {
//       return { sendHelp: true, command: this, message };
//     }

//     const parsedArgs = await AddReactionRole.parseArgs(args, message, bot);
//     if (!parsedArgs) {
//       return { sendHelp: false, command: this, message };
//     }

//     const emote: ReactionEmoji | GuildEmoji | undefined = await CommandUtils.getEmote(message, bot);
//     if (!emote) {
//       return { sendHelp: false, command: this, message };
//     }

//     const config = bot.db.reactionRoles.getReactionRole(message, emote.identifier);
//     if (config === null) {
//       await CommandUtils.sendMessage('Error checking database, please try again later.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }
//     if (config) {
//       const emoji = await CommandUtils.makeEmoteFromId(config.emoteId, bot.client);
//       await CommandUtils.sendMessage(`Adding reaction role failed. Reaction role with emote ${emoji} already exists.`, message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }

//     if (!await AddReactionRole.checkPerms(parsedArgs.role, parsedArgs.reactionMessage, message, bot)) {
//       return { sendHelp: false, command: this, message };
//     }

//     const dbResult = bot.db.reactionRoles.setReactionRole(parsedArgs.reactionMessage, emote.identifier, parsedArgs.role);
//     if (!dbResult) {
//       await CommandUtils.sendMessage('Adding reaction role failed.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }

//     // React to message
//     try {
//       await parsedArgs.reactionMessage.react(emote);
//     } catch (err) {
//       await CommandUtils.sendMessage('Error reacting to message. Do I have perms? The reaction role is still registered.', message.channel, bot);
//       await this.logger.warning(
//         // eslint-disable-next-line max-len
//         `Error reacting to message ${parsedArgs.reactionMessage.id} in channel ${parsedArgs.reactionMessage.channel.id} in guild ${parsedArgs.reactionMessage.guild?.id}`,
//         err,
//       );
//     }

//     return { sendHelp: false, command: this, message };
//   }

//   private static async parseArgs(args: string[], message: Message, bot: Bot): Promise<ReactionRoleParsedArgs | undefined> {
//     let reactionMessage: Message;

//     // Parse message link
//     const splitLink = args[0].split('/');
//     if (splitLink.length < 7) {
//       await CommandUtils.sendMessage('Adding reaction role failed. Invalid message link specified.', message.channel, bot);
//       return undefined;
//     }

//     const linkGuildId: string = splitLink[4];
//     const linkChannelId: string = splitLink[5];
//     const linkMessageId: string = splitLink[6];

//     if (linkGuildId !== message.guild!.id) {
//       await CommandUtils.sendMessage('Adding reaction role failed. The message link was for a message not in this guild.', message.channel, bot);
//       return undefined;
//     }

//     const channel = await CommandUtils.parseTextChannel(linkChannelId, message.client);
//     if (!channel) {
//       await CommandUtils.sendMessage("Adding reaction role failed. I couldn't find the channel.", message.channel, bot);
//       return undefined;
//     }
//     if (channel.type === 'DM') {
//       await CommandUtils.sendMessage("Adding reaction role failed. I couldn't find the channel.", message.channel, bot);
//       return undefined;
//     }

//     try {
//       reactionMessage = await channel.messages.fetch(linkMessageId);
//     } catch (err) {
//       await CommandUtils.sendMessage("Adding reaction role failed. I couldn't find the message.", message.channel, bot);
//       return undefined;
//     }

//     const role = await CommandUtils.parseRole(args[1], channel.guild);
//     if (!role) {
//       await CommandUtils.sendMessage('Adding reaction role failed. Invalid role specified.', message.channel, bot);
//       return undefined;
//     }

//     return {
//       reactionMessage, role,
//     };
//   }

//   private static async checkPerms(role: Role, reactionMessage: Message, message: Message, bot: Bot): Promise<boolean> {
//     if (!role.guild.me || !reactionMessage.guild?.me || !(reactionMessage.channel as GuildChannelResolvable)) {
//       return false;
//     }
//     // Manage roles
//     if (!role.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
//       await CommandUtils.sendMessage('Adding reaction role failed. I do not have the Manage Roles permission.', message.channel, bot);
//       return false;
//     }
//     // If role below us
//     if (role.comparePositionTo(role.guild.me.roles.highest) > 0) {
//       await CommandUtils.sendMessage(
//         'Adding reaction role failed. Invalid hierarchy, my highest role is below the given role.',
//         message.channel, bot,
//       );
//       return false;
//     }
//     // If we can't react in the channel
//     if (!reactionMessage.guild.me.permissionsIn(reactionMessage.channel as GuildChannelResolvable).has(Permissions.FLAGS.ADD_REACTIONS)) {
//       await CommandUtils.sendMessage(
//         `Adding reaction role failed. I do not have reaction perms in ${reactionMessage.channel.toString()}`,
//         message.channel, bot,
//       );
//       return false;
//     }

//     return true;
//   }
// }

// class RemoveReactionRole extends Command {
//   constructor(group: CommandGroup, bot: Bot) {
//     super('remove', PermissionLevel.Admin, 'Removes a reaction role', bot, {
//       usage: '<name>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR, aliases: ['del', 'delete'],
//     });
//   }

//   public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
//     if (args.length < 1) {
//       return { sendHelp: true, command: this, message };
//     }

//     const reactionMessage = await RemoveReactionRole.parseArgs(args, message, bot);
//     if (!reactionMessage) {
//       return { sendHelp: false, command: this, message };
//     }
//     const emote: ReactionEmoji | GuildEmoji | undefined = await CommandUtils.getEmote(message, bot);
//     if (!emote) {
//       return { sendHelp: false, command: this, message };
//     }
//     const config = bot.db.reactionRoles.getReactionRole(reactionMessage, emote.identifier);

//     if (config === null) {
//       await CommandUtils.sendMessage('Error accessing db, please try again later.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }
//     if (!config) {
//       await CommandUtils.sendMessage('Error removing reaction role, it does not exist.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }

//     const success: boolean = await this.removeReactionRole(message, emote.identifier, bot);
//     if (success) {
//       await CommandUtils.sendMessage('Reaction role removed successfully.', message.channel, bot);
//     } else {
//       await CommandUtils.sendMessage('Error removing reaction role.', message.channel, bot);
//     }

//     return { sendHelp: false, command: this, message };
//   }

//   private async removeReactionRole(message: Message, emoteId: string, bot: Bot): Promise<boolean> {
//     const result = bot.db.reactionRoles.removeReactionRole(message.channel.id, message.id, emoteId);

//     if (!result) return false;

//     // Remove our reaction
//     const reaction: MessageReaction | undefined = await this.getReaction(message, emoteId);
//     if (reaction) {
//       try {
//         await reaction.users.remove(message.client.user!);
//       } catch (err) {
//         await CommandUtils.sendMessage('Unexpected error occurred when removing reaction.', message.channel, bot);
//         await this.logger.warning('Error removing reaction from message.', err);
//       }
//     }
//     return true;
//   }

//   private async getReaction(message: Message, emoteId: string): Promise<MessageReaction | undefined> {
//     let reaction: MessageReaction | undefined;

//     // Get reaction
//     try {
//       reaction = message.reactions.cache.get(emoteId);
//       if (reaction?.partial) {
//         reaction = await reaction.fetch();
//       }
//     } catch (err) {
//       await this.logger.warning(
//         // eslint-disable-next-line max-len
//         `Error getting reaction ${emoteId} from message,channel,guild ${message.id}.${message.channelId},${message.guildId}`,
//       );
//       reaction = undefined;
//     }
//     return reaction;
//   }

//   private static async parseArgs(args: string[], message: Message, bot: Bot): Promise<Message | undefined> {
//     let reactionMessage: Message;

//     // Parse message link
//     const splitLink = args[0].split('/');
//     if (splitLink.length < 7) {
//       await CommandUtils.sendMessage('Removing reaction role failed. Invalid message link specified.', message.channel, bot);
//       return undefined;
//     }

//     const linkGuildId: string = splitLink[4];
//     const linkChannelId: string = splitLink[5];
//     const linkMessageId: string = splitLink[6];

//     if (linkGuildId !== message.guild!.id) {
//       await CommandUtils.sendMessage('Removing reaction role failed. The message link was for a message not in this guild.', message.channel, bot);
//       return undefined;
//     }

//     const channel = await CommandUtils.parseTextChannel(linkChannelId, message.client);
//     if (!channel) {
//       await CommandUtils.sendMessage("Removing reaction role failed. I couldn't find the channel.", message.channel, bot);
//       return undefined;
//     }
//     if (channel.type === 'DM') {
//       await CommandUtils.sendMessage("Removing reaction role failed. I couldn't find the channel.", message.channel, bot);
//       return undefined;
//     }

//     try {
//       reactionMessage = await channel.messages.fetch(linkMessageId);
//     } catch (err) {
//       await CommandUtils.sendMessage("Removing reaction role failed. I couldn't find the message.", message.channel, bot);
//       return undefined;
//     }

//     return reactionMessage;
//   }
// }

// class ListReactionRoles extends Command {
//   constructor(group: CommandGroup, bot: Bot) {
//     super(
//       'list', PermissionLevel.Admin, 'Gets list of reaction roles', bot,
//       { runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR },
//     );
//   }

//   async run(bot: Bot, message: Message): Promise<CommandResult> {
//     // Get reactionroles
//     const reactionRoles = bot.db.reactionRoles.getReactionRolesByGuild(message.guild!);

//     if (reactionRoles === null) {
//       await CommandUtils.sendMessage('Error accessing db, please try again later.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }
//     if (!reactionRoles || reactionRoles.length < 1) {
//       await CommandUtils.sendMessage('I have no current reaction roles.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }

//     // List of strings
//     const stringList: string[] = [];
//     let currString: string;
//     reactionRoles.forEach(async (reactionRole) => {
//       let reactionChannel: TextChannel | NewsChannel;
//       let reactionMessage: Message;

//       currString = '';

//       try {
//         reactionChannel = <TextChannel | NewsChannel> await message.client.channels.fetch(reactionRole.channelId);
//         reactionMessage = await reactionChannel.messages.fetch(reactionRole.messageId);
//         currString += `[Message](${reactionMessage.url}),`;
//       } catch (err) {
//         currString += `BROKEN: Channel: <#${reactionRole.channelId}>, Message: ${reactionRole.messageId},`;
//       }

//       currString += ` Emote: ${await CommandUtils.makeEmoteFromId(reactionRole.emoteId, message.client)},`;
//       currString += ` Role: <@&${reactionRole.roleId}>`;
//       stringList.push(currString);
//     });

//     // Make paginator
//     const paginator: ReactionPaginator = new ReactionPaginator(stringList, 10,
//       'Reaction Roles', message.channel, bot, this);

//     await paginator.postMessage();

//     return { sendHelp: false, command: this, message };
//   }
// }

// export class ReactionRoleManagement extends CommandGroup {
//   constructor(bot: Bot) {
//     super('reactionrole', 'Manages reaction roles', bot, { runsInDm: false });

//     this.registerSubCommands(bot);
//   }

//   protected registerSubCommands(bot: Bot): void {
//     this.registerSubCommand(new AddReactionRole(this, bot));
//     this.registerSubCommand(new RemoveReactionRole(this, bot));
//     this.registerSubCommand(new ListReactionRoles(this, bot));
//   }
// }

// type ReactionRoleParsedArgs = {
//   role: Role;
//   reactionMessage: Message;
// };
