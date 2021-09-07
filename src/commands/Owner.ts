/* eslint-disable max-classes-per-file */
import CommandGroup from 'commands/CommandGroup';
import { Command, CommandResult, PermissionLevel } from 'commands/Command';
import type Bot from 'Bot';
import CommandUtils from 'utils/CommandUtils';

import type {
  Message, User, ActivityOptions, WebhookClient,
} from 'discord.js';

class SetUsername extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('name', PermissionLevel.Owner, 'Sets bot username.', bot, {
      usage: '<username>', group, longDesc: 'Minimum username length is 2 characters.', aliases: ['username'],
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    const newUsername: string = args.join(' ');

    if (newUsername.length < 2) {
      return { sendHelp: true, command: this, message };
    }

    try {
      await message.client.user!.setUsername(newUsername);
      await CommandUtils.sendMessage('Username changed successfully.', message.channel, bot);
    } catch (err) {
      await CommandUtils.sendMessage('Error changing username, check log for details.', message.channel, bot);
      await this.logger.error('Error changing username.', err);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetAvatar extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('avatar', PermissionLevel.Owner, 'Sets bot avatar', bot, { usage: '<image url>', group });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }
    try {
      await message.client.user!.setAvatar(args[0]);
      await CommandUtils.sendMessage('Avatar changed successfully.', message.channel, bot);
    } catch (err) {
      await CommandUtils.sendMessage('Error changing avatar, check log for details.', message.channel, bot);
      await this.logger.error('Error changing avatar.', err);
    }
    return { sendHelp: false, command: this, message };
  }
}

class AddOwner extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('addowner', PermissionLevel.Owner, 'Adds a bot owner', bot, { usage: '<owner>', group });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const user: User | undefined = await CommandUtils.parseUser(args.join(' '), message.client);

    if (user === undefined) {
      return { sendHelp: true, command: this, message };
    }

    if (await bot.addOwner(user.id)) {
      await CommandUtils.sendMessage(`Owner ${user.toString()} added successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`User ${user.toString()} is already an owner.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class RemoveOwner extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('removeowner', PermissionLevel.Owner, 'Removes a bot owner', bot, { usage: '<owner>', group, aliases: ['delowner'] });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const user: User | undefined = await CommandUtils.parseUser(args.join(' '), message.client);

    if (user === undefined) {
      return { sendHelp: true, command: this, message };
    }

    if (await bot.removeOwner(user.id)) {
      await CommandUtils.sendMessage(`Owner ${user.toString()} removed successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`User ${user.toString()} is not an owner.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetDefaultPrefix extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('prefix', PermissionLevel.Owner, 'Sets bot default prefix', bot, { usage: '<prefix>', group });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const prefix: string = args.join(' ');

    const result: boolean = await bot.config.setPrefix(prefix);

    if (result) {
      await CommandUtils.sendMessage(`Default prefix set to ${prefix} successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage('Default prefix was unable to be set.', message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetStatus extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('status', PermissionLevel.Owner, 'Sets bot status', bot, { usage: '<online, away/idle, dnd, invis/offline>', group });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    switch (args[0]) {
      case 'online':
        message.client.user!.setStatus('online');
        break;
      case 'away':
      case 'idle':
        message.client.user!.setStatus('idle');
        break;
      case 'dnd':
        message.client.user!.setStatus('dnd');
        break;
      case 'invis':
      case 'invisible':
      case 'offline':
        message.client.user!.setStatus('invisible');
        break;
      default:
        return { sendHelp: true, command: this, message };
    }

    await CommandUtils.sendMessage('Status updated successfully.', message.channel, bot);
    return { sendHelp: false, command: this, message };
  }
}

class SetActivity extends Command {
  private readonly STREAMING_URL: string = 'https://twitch.tv/jpdown';

  constructor(group: CommandGroup, bot: Bot) {
    super(
      'activity', PermissionLevel.Owner, 'Sets bot activity', bot,
      { usage: '<playing, streaming, listening, watching, clear> <activity string>', group, aliases: ['presence'] },
    );
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1 || (args.length < 2 && args[0] !== 'clear')) {
      return { sendHelp: true, command: this, message };
    }

    const activityType: string | undefined = args.shift();
    let activityString: string = args.join(' ');
    let activityOptions: ActivityOptions;

    switch (activityType) {
      case 'playing':
        activityOptions = { type: 'PLAYING' };
        break;
      case 'streaming':
        activityOptions = { type: 'STREAMING', url: this.STREAMING_URL };
        break;
      case 'listening':
        activityOptions = { type: 'LISTENING' };
        break;
      case 'watching':
        activityOptions = { type: 'WATCHING' };
        break;
      case 'clear':
        activityString = '';
        activityOptions = {};
        break;
      default:
        return { sendHelp: true, command: this, message };
    }

    message.client.user!.setActivity(activityString, activityOptions);
    await CommandUtils.sendMessage('Activity updated successfully.', message.channel, bot);

    return { sendHelp: false, command: this, message };
  }
}

class SetErrorLogWebhook extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('errorwebhook', PermissionLevel.Owner, 'Sets bot error log webhook', bot, { usage: '<webhook url>', group });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const webhook: WebhookClient = await CommandUtils.parseWebhookUrl(args[0]);
    if (webhook === undefined) {
      return { sendHelp: true, command: this, message };
    }

    // Set webhook
    const result: boolean = await bot.config.setErrorWebhook(webhook);

    if (result) {
      await CommandUtils.sendMessage('Log webhook set successfully.', message.channel, bot);
    } else {
      await CommandUtils.sendMessage('Log webhook was unable to be set.', message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class GetInviteLink extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('getinvite', PermissionLevel.Owner, "Gets invite link (wow you're lazy)", bot, { group });
  }

  public async run(bot: Bot, message: Message): Promise<CommandResult> {
    const invite = message.client.generateInvite({
      scopes: ['applications.commands', 'bot'],
      permissions: [
        'ADD_REACTIONS', 'BAN_MEMBERS', 'CHANGE_NICKNAME', 'EMBED_LINKS', 'KICK_MEMBERS', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES',
        'MANAGE_NICKNAMES', 'MANAGE_ROLES', 'MANAGE_THREADS', 'MANAGE_WEBHOOKS', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES',
        'USE_EXTERNAL_EMOJIS', 'USE_EXTERNAL_STICKERS', 'USE_PUBLIC_THREADS', 'USE_PRIVATE_THREADS', 'VIEW_AUDIT_LOG', 'VIEW_CHANNEL',
      ],
    });

    await CommandUtils.sendMessage(`[Invite Link](${invite})`, message.channel, bot);

    return { sendHelp: false, command: this, message };
  }
}

// eslint-disable-next-line import/prefer-default-export
export class Owner extends CommandGroup {
  constructor(bot: Bot) {
    super('owner', 'Owner commands (you know this already)', bot);

    this.registerSubCommands(bot);
  }

  protected registerSubCommands(bot: Bot): void {
    this.registerSubCommand(new SetUsername(this, bot));
    this.registerSubCommand(new SetAvatar(this, bot));
    this.registerSubCommand(new AddOwner(this, bot));
    this.registerSubCommand(new RemoveOwner(this, bot));
    this.registerSubCommand(new SetDefaultPrefix(this, bot));
    this.registerSubCommand(new SetStatus(this, bot));
    this.registerSubCommand(new SetActivity(this, bot));
    this.registerSubCommand(new SetErrorLogWebhook(this, bot));
    this.registerSubCommand(new GetInviteLink(this, bot));
  }
}
