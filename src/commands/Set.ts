import { CommandGroup } from 'commands/CommandGroup';
import { Command, CommandResult, PermissionLevel } from 'commands/Command';
import Bot from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';

import {
  Message, GuildMember, Role, TextChannel, Channel, Permissions,
} from 'discord.js';

export class Set extends CommandGroup {
  constructor(bot: Bot) {
    super('set', 'Sets various bot parameters', bot);

    this.registerSubCommands(bot);
  }

  protected registerSubCommands(bot: Bot): void {
    this.registerSubCommand(new SetNickname(this, bot));
    this.registerSubCommand(new SetGuildPrefix(this, bot));
    this.registerSubCommand(new SetVipRole(this, bot));
    this.registerSubCommand(new SetModRole(this, bot));
    this.registerSubCommand(new SetAdminRole(this, bot));
    this.registerSubCommand(new SetEventLogChannel(this, bot));
    this.registerSubCommand(new SetModErrorLogChannel(this, bot));
  }
}

class SetNickname extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('nickname', PermissionLevel.Mod, "Sets bot or another member's nickname", bot, {
      usage: '[member] <new nickname>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.MANAGE_NICKNAMES, aliases: ['nick'],
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    let member: GuildMember | undefined;
    let newNickname: string;
    if (args.length > 0) {
      member = await CommandUtils.parseMemberPingOnly(args[0], message.guild!);
    }

    if (member !== undefined) {
      args.shift();
    } else {
      member = message.guild!.me!;
    }

    // Check if we can change nickname
    if (!await this.checkPerms(member, message, bot)) {
      return { sendHelp: false, command: this, message };
    }

    newNickname = args.join(' ');

    try {
      await member.setNickname(newNickname);
      await CommandUtils.sendMessage(`Nickname for ${member.toString()} changed successfully.`, message.channel, bot);
    } catch (err) {
      await CommandUtils.sendMessage('Error changing nickname, missing perms?', message.channel, bot);
      await this.logger.error('Error changing nickname, missing perms?', err);
    }
    return { sendHelp: false, command: this, message };
  }

  private async checkPerms(member: GuildMember, message: Message, bot: Bot): Promise<boolean> {
    if (member.id === member.client.user!.id && !member.permissions.has(Permissions.FLAGS.CHANGE_NICKNAME)) {
      await CommandUtils.sendMessage("Setting nickname failed: I'm missing permission to change my own nickname.", message.channel, bot);
      return false;
    }
    if (member.id !== member.client.user!.id && !message.guild!.me!.permissions.has(Permissions.FLAGS.MANAGE_NICKNAMES)) {
      await CommandUtils.sendMessage("Setting nickname failed: I'm missing permission to change other nicknames.", message.channel, bot);
      return false;
    }
    if (member.id !== member.client.user!.id && message.guild!.me!.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
      await CommandUtils.sendMessage("Setting nickname failed: My top role is below the member's top role.", message.channel, bot);
      return false;
    }
    if (member.id !== member.client.user!.id && member.id === member.guild.ownerId) {
      await CommandUtils.sendMessage('Setting nickname failed: I cannot change the nickname of the server owner.', message.channel, bot);
      return false;
    }

    return true;
  }
}

class SetGuildPrefix extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('prefix', PermissionLevel.Admin, 'Sets prefix in guild', bot, {
      usage: '<prefix>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const prefix: string = args.join(' ');

    const result: boolean = await bot.commandManager.setGuildPrefix(message.guild!.id, prefix);

    if (result) {
      await CommandUtils.sendMessage(`Prefix for guild ${message.guild!.name} set to ${prefix} successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Prefix was unable to be set for guild ${message.guild!.name}.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetVipRole extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('viprole', PermissionLevel.Admin, "Sets bot's vip role", bot, {
      usage: '<role>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const role: Role | null = await CommandUtils.parseRole(args.join(' '), message.guild!);

    if (role === null) {
      return { sendHelp: true, command: this, message };
    }

    const result: boolean = await bot.configs.guildConfig.setVipRole(message.guild!.id, role.id);

    if (result) {
      await CommandUtils.sendMessage(`VIP role for guild ${message.guild!.name} set to ${role.toString()} successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`VIP role was unable to be set for guild ${message.guild!.name}.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetModRole extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('modrole', PermissionLevel.Admin, "Sets bot's mod role", bot, {
      usage: '<role>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const role: Role | null = await CommandUtils.parseRole(args.join(' '), message.guild!);

    if (role === null) {
      return { sendHelp: true, command: this, message };
    }

    const result: boolean = await bot.configs.guildConfig.setModRole(message.guild!.id, role.id);

    if (result) {
      await CommandUtils.sendMessage(`Mod role for guild ${message.guild!.name} set to ${role.toString()} successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Mod role was unable to be set for guild ${message.guild!.name}.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetAdminRole extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('adminrole', PermissionLevel.Admin, "Sets bot's admin role", bot, {
      usage: '<role>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const role: Role | null = await CommandUtils.parseRole(args.join(' '), message.guild!);

    if (role === null) {
      return { sendHelp: true, command: this, message };
    }

    const result: boolean = await bot.configs.guildConfig.setAdminRole(message.guild!.id, role.id);

    if (result) {
      await CommandUtils.sendMessage(`Admin role for guild ${message.guild!.name} set to ${role.toString()} successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Admin role was unable to be set for guild ${message.guild!.name}.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetEventLogChannel extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('eventlog', PermissionLevel.Admin, 'Sets bot eventlog channel', bot, {
      usage: '<channel>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const channel: Channel | null = await CommandUtils.parseChannel(args.join(' '), message.client);

    if (channel === null || !(channel as TextChannel)) {
      return { sendHelp: true, command: this, message };
    }

    // Set channel
    const result: boolean = await bot.eventLogger.setEventlogChannel(message.guild!.id, channel.id);

    if (result) {
      await CommandUtils.sendMessage(`Eventlog channel set to ${channel.toString()} for guild ${message.guild!.name} successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Eventlog channel was unable to be set for guild ${message.guild!.name}.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

class SetModErrorLogChannel extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('moderror', PermissionLevel.Admin, 'Sets mod error log channel', bot, {
      usage: '<channel>', runsInDm: false, group, requiredPerm: Permissions.FLAGS.ADMINISTRATOR,
    });
  }

  public async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const channel: Channel | null = await CommandUtils.parseChannel(args.join(' '), message.client);

    if (channel === null || !(channel as TextChannel)) {
      return { sendHelp: true, command: this, message };
    }

    // Set channel
    const result: boolean = await bot.configs.guildConfig.setModErrorChannel(message.guild!.id, channel.id);

    if (result) {
      await CommandUtils.sendMessage(`Mod error log channel set to ${channel.toString()} for guild ${message.guild!.name} successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Mod error log channel was unable to be set for guild ${message.guild!.name}.`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}
