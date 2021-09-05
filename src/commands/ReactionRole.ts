/* eslint-disable max-classes-per-file */
import CommandGroup from 'commands/CommandGroup';
import { Command, CommandResult, PermissionLevel } from 'commands/Command';
import Bot from 'Bot';
import { ReactionRoleObject } from 'config/ReactionRoleConfig';
import ReactionPaginator from 'utils/ReactionPaginator';
import CommandUtils from 'utils/CommandUtils';

import {
  Message, Role, TextChannel, NewsChannel, Permissions, ReactionEmoji,
  MessageReaction, GuildEmoji, Snowflake, GuildChannelResolvable,
} from 'discord.js';

class AddReactionRole extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('add', PermissionLevel.Admin, 'Adds a reaction role', bot, {
      usage: '<message link> <role> <name>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 3) {
      return { sendHelp: true, command: this, message };
    }

    const reactionRoleParsedArgs = await AddReactionRole.parseArgs(args, message, bot);
    if (!reactionRoleParsedArgs) {
      return { sendHelp: false, command: this, message };
    }

    if (await bot.configs.reactionRoleConfig.guildHasReactionRoleName(message.guild!.id, reactionRoleParsedArgs.name)) {
      await CommandUtils.sendMessage(
        `Adding reaction role failed. Reaction role ${reactionRoleParsedArgs.name} already exists.`,
        message.channel, bot,
      );
      return { sendHelp: false, command: this, message };
    }

    if (!await AddReactionRole.checkPerms(reactionRoleParsedArgs.role, reactionRoleParsedArgs.reactionMessage, message, bot)) {
      return { sendHelp: false, command: this, message };
    }

    const emote: ReactionEmoji | GuildEmoji | undefined = await CommandUtils.getEmote(message, bot);
    if (!emote) {
      return { sendHelp: false, command: this, message };
    }

    // Create object
    const reactionRoleObject: ReactionRoleObject = {
      guildID: message.guild!.id,
      channelID: reactionRoleParsedArgs.channel.id,
      messageID: reactionRoleParsedArgs.reactionMessage.id,
      emoteID: emote.identifier,
      roleID: reactionRoleParsedArgs.role.id,
      name: reactionRoleParsedArgs.name,
    };

    // eslint-disable-next-line max-len
    if (await bot.configs.reactionRoleConfig.guildHasReactionRoleEmote(reactionRoleObject.guildID, reactionRoleObject.emoteID, reactionRoleObject.messageID)) {
      await CommandUtils.sendMessage(`Adding reaction role failed. Reaction role with emote ${
        await CommandUtils.makeEmoteFromId(reactionRoleObject.emoteID, message) ?? reactionRoleObject.emoteID
      } already exists.`, message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const success: boolean = await this.addReactionRole(reactionRoleObject, reactionRoleParsedArgs.reactionMessage, message, bot);
    if (success) {
      await CommandUtils.sendMessage(`Reaction role ${reactionRoleObject.name} added successfully.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }

  private static async parseArgs(args: string[], message: Message, bot: Bot): Promise<ReactionRoleParsedArgs | undefined> {
    let reactionMessage: Message;

    // Parse message link
    const splitLink = args[0].split('/');
    if (splitLink.length < 7) {
      await CommandUtils.sendMessage('Adding reaction role failed. Invalid message link specified.', message.channel, bot);
      return undefined;
    }

    const linkGuildId: string = splitLink[4];
    const linkChannelId: string = splitLink[5];
    const linkMessageId: string = splitLink[6];

    if (linkGuildId !== message.guild!.id) {
      await CommandUtils.sendMessage('Adding reaction role failed. The message link was for a message not in this guild.', message.channel, bot);
      return undefined;
    }

    const channel = <TextChannel | NewsChannel> await CommandUtils.parseChannel(linkChannelId, message.client);
    if (!channel) {
      await CommandUtils.sendMessage("Adding reaction role failed. I couldn't find the channel.", message.channel, bot);
      return undefined;
    }

    try {
      reactionMessage = await channel.messages.fetch(linkMessageId);
    } catch (err) {
      await CommandUtils.sendMessage("Adding reaction role failed. I couldn't find the message.", message.channel, bot);
      return undefined;
    }

    const role = await CommandUtils.parseRole(args[1], channel.guild);
    if (!role) {
      await CommandUtils.sendMessage('Adding reaction role failed. Invalid role specified.', message.channel, bot);
      return undefined;
    }

    const name = args[2];

    return {
      channel, reactionMessage, role, name,
    };
  }

  private static async checkPerms(role: Role, reactionMessage: Message, message: Message, bot: Bot): Promise<boolean> {
    if (!role.guild.me || !reactionMessage.guild?.me || !(reactionMessage.channel as GuildChannelResolvable)) {
      return false;
    }
    // Manage roles
    if (!role.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
      await CommandUtils.sendMessage('Adding reaction role failed. I do not have the Manage Roles permission.', message.channel, bot);
      return false;
    }
    // If role below us
    if (role.comparePositionTo(role.guild.me.roles.highest) > 0) {
      await CommandUtils.sendMessage(
        'Adding reaction role failed. Invalid hierarchy, my highest role is below the given role.',
        message.channel, bot,
      );
      return false;
    }
    // If we can't react in the channel
    if (!reactionMessage.guild.me.permissionsIn(reactionMessage.channel as GuildChannelResolvable).has(Permissions.FLAGS.ADD_REACTIONS)) {
      await CommandUtils.sendMessage(
        `Adding reaction role failed. I do not have reaction perms in ${reactionMessage.channel.toString()}`,
        message.channel, bot,
      );
      return false;
    }

    return true;
  }

  private async addReactionRole(reactionRole: ReactionRoleObject, reactionMessage: Message, message: Message, bot: Bot): Promise<boolean> {
    const dbResult: boolean = await bot.configs.reactionRoleConfig.addReactionRole(reactionRole);
    if (!dbResult) {
      await CommandUtils.sendMessage('Adding reaction role failed.', message.channel, bot);
      return false;
    }

    // React to message
    try {
      await reactionMessage.react(reactionRole.emoteID);
      return true;
    } catch (err) {
      await CommandUtils.sendMessage('Adding reaction role failed. Unexpected error while reacting to message.', message.channel, bot);
      await this.logger.warning(
        `Error reacting to message ${reactionMessage.id} in channel ${reactionMessage.channel.id} in guild ${reactionMessage.guild?.id}`, err,
      );
      await bot.configs.reactionRoleConfig.removeReactionRole(reactionRole.guildID, reactionRole.name);
      return false;
    }
  }
}

class RemoveReactionRole extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('remove', PermissionLevel.Admin, 'Removes a reaction role', bot, {
      usage: '<name>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR, aliases: ['del', 'delete'],
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const name: string = args[0];

    if (!await bot.configs.reactionRoleConfig.guildHasReactionRoleName(message.guild!.id, name)) {
      await CommandUtils.sendMessage(`Reaction role ${name} does not exist.`, message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const success: boolean = await this.removeReactionRole(message.guild!.id, name, message, bot);
    if (success) {
      await CommandUtils.sendMessage(`Reaction role ${name} removed successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage('Error removing reaction role.', message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }

  private async removeReactionRole(guildId: Snowflake, name: string, message: Message, bot: Bot): Promise<boolean> {
    const removedReactionRole: ReactionRoleObject | undefined = await bot.configs.reactionRoleConfig.removeReactionRole(guildId, name);

    if (!removedReactionRole) return false;

    // Remove our reaction
    const reaction: MessageReaction | undefined = await this.getReaction(removedReactionRole, bot);
    if (reaction) {
      try {
        await reaction.users.remove(message.client.user!);
      } catch (err) {
        await CommandUtils.sendMessage('Unexpected error occurred when removing reaction.', message.channel, bot);
        await this.logger.warning('Error removing reaction from message.', err);
      }
    }
    return true;
  }

  private async getReaction(reactionRole: ReactionRoleObject, bot: Bot): Promise<MessageReaction | undefined> {
    let channel: TextChannel | NewsChannel;
    let reactionMessage: Message;
    let reaction: MessageReaction | undefined;

    // Get channel
    try {
      channel = <TextChannel | NewsChannel> await bot.client.channels.fetch(reactionRole.channelID);
    } catch (err) {
      return undefined;
    }
    // Get message
    try {
      reactionMessage = await channel.messages.fetch(reactionRole.messageID);
    } catch (err) {
      return undefined;
    }
    // Get reaction
    try {
      reaction = reactionMessage.reactions.cache.get(reactionRole.emoteID);
      if (reaction?.partial) {
        reaction = await reaction.fetch();
      }
    } catch (err) {
      await this.logger.warning(
        // eslint-disable-next-line max-len
        `Error getting reaction ${reactionRole.name} ${reactionRole.emoteID} from message,channel,guild ${reactionRole.messageID}.${reactionRole.channelID},${reactionRole.guildID}`,
      );
      reaction = undefined;
    }
    return reaction;
  }
}

class ListReactionRoles extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super(
      'list', PermissionLevel.Admin, 'Gets list of reaction roles', bot,
      { runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR },
    );
  }

  async run(bot: Bot, message: Message): Promise<CommandResult> {
    // Get reactionroles
    const reactionRoles: ReactionRoleObject[] | undefined = await bot.configs.reactionRoleConfig.getGuildReactionRoles(message.guild!.id);

    if (!reactionRoles || reactionRoles.length < 1) {
      await CommandUtils.sendMessage('I have no current reaction roles.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // List of strings
    const stringList: string[] = [];
    let currString: string;
    reactionRoles.forEach(async (reactionRole) => {
      let reactionChannel: TextChannel | NewsChannel;
      let reactionMessage: Message;

      currString = `\`${reactionRole.name}\` - `;

      try {
        reactionChannel = <TextChannel | NewsChannel> await message.client.channels.fetch(reactionRole.channelID);
        reactionMessage = await reactionChannel.messages.fetch(reactionRole.messageID);
        currString += `[Message](${reactionMessage.url}),`;
      } catch (err) {
        currString += `BROKEN: Channel: <#${reactionRole.channelID}>, Message: ${reactionRole.messageID},`;
      }

      currString += ` Emote: ${await CommandUtils.makeEmoteFromId(reactionRole.emoteID, message)},`;
      currString += ` Role: <@&${reactionRole.roleID}>`;
      stringList.push(currString);
    });

    // Make paginator
    const paginator: ReactionPaginator = new ReactionPaginator(stringList, 10,
      'Reaction Roles', message.channel, bot, this);

    await paginator.postMessage();

    return { sendHelp: false, command: this, message };
  }
}

export class ReactionRoleManagement extends CommandGroup {
  constructor(bot: Bot) {
    super('reactionrole', 'Manages reaction roles', bot, { runsInDm: false });

    this.registerSubCommands(bot);
  }

  protected registerSubCommands(bot: Bot): void {
    this.registerSubCommand(new AddReactionRole(this, bot));
    this.registerSubCommand(new RemoveReactionRole(this, bot));
    this.registerSubCommand(new ListReactionRoles(this, bot));
  }
}

export interface ReactionRoleParsedArgs {
  channel: TextChannel | NewsChannel;
  reactionMessage: Message;
  role: Role;
  name: string;
}
