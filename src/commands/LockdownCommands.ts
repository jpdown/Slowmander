/* eslint-disable max-classes-per-file */
import { Command, PermissionLevel, CommandResult } from 'commands/Command';
import CommandGroup from 'commands/CommandGroup';
import Bot from 'Bot';
import CommandUtils from 'utils/CommandUtils';
import { LockdownConfigObject } from 'config/LockdownConfig';
import ReactionPaginator from 'utils/ReactionPaginator';
import LockdownHelper from 'utils/LockdownHelper';

import {
  Message, Permissions, Role, Guild,
} from 'discord.js';

export class Lockdown extends Command {
  constructor(bot: Bot) {
    super(
      'lockdown', PermissionLevel.Mod, 'Locks down guild', bot,
      { usage: '[preset]', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false },
    );
  }

  async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    try {
      await LockdownHelper.lockUnlock(bot, message, args, true);
    } catch (err) {
      await CommandUtils.sendMessage('Error locking server.', message.channel, bot);
      await this.logger.error(`Error locking guild ${message.guild!.name}`, err);
    }

    return { sendHelp: false, command: this, message };
  }
}

export class Unlock extends Command {
  constructor(bot: Bot) {
    super(
      'unlock', PermissionLevel.Mod, 'Unlocks guild', bot,
      { usage: '[preset]', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false },
    );
  }

  async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    try {
      await LockdownHelper.lockUnlock(bot, message, args, false);
    } catch (err) {
      await CommandUtils.sendMessage('Error unlocking server.', message.channel, bot);
      await this.logger.error(`Error unlocking guild ${message.guild!.name}`, err);
    }

    return { sendHelp: false, command: this, message };
  }
}

class ManageLockdownList extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('list', PermissionLevel.Mod, 'Lists lockdown presets', bot, { requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group });
  }

  async run(bot: Bot, message: Message): Promise<CommandResult> {
    const lockdownPresets = await bot.configs.lockdownConfig.getAllLockdownPresets(message.guild!.id);

    if (!lockdownPresets || lockdownPresets.length < 1) {
      await CommandUtils.sendMessage('No presets found.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    const presetNames: string[] = [];
    lockdownPresets.forEach((preset) => {
      presetNames.push(preset.name);
    });

    // Make paginator
    const paginator = new ReactionPaginator(presetNames, 10, `Lockdown presets in guild ${message.guild!.name}`, message.channel, bot, this);
    await paginator.postMessage();

    return { sendHelp: false, command: this, message };
  }
}

class ManageLockdownInfo extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('info', PermissionLevel.Mod, 'Gives information on specific lockdown preset', bot, {
      usage: '<preset>', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group,
    });
  }

  async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    const lockdownPreset = await bot.configs.lockdownConfig.getLockdownPreset(message.guild!.id, args[0]);

    if (!lockdownPreset) {
      return { sendHelp: true, command: this, message };
    }

    // Make lists
    const channelList: string[] = [];
    lockdownPreset.channelIDs.forEach((channel) => {
      channelList.push(`<#${channel}>`);
    });
    const roleList: string[] = [];
    roleList.forEach((role) => {
      roleList.push(`<@&${role}>`);
    });

    // Make paginators
    const channelPaginator = new ReactionPaginator(channelList, 10, `Channels in lockdown preset ${lockdownPreset.name}`, message.channel, bot, this);
    await channelPaginator.postMessage();
    const rolePaginator = new ReactionPaginator(roleList, 10, `Roles in lockdown preset ${lockdownPreset.name}`, message.channel, bot, this);
    await rolePaginator.postMessage();

    return { sendHelp: false, command: this, message };
  }
}

class ManageLockdownSet extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('set', PermissionLevel.Mod, 'Sets lockdown preset channels and roles', bot, {
      usage: '<preset> <channel,...> <role,...> <grant/neutral>', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group,
    });
  }

  async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 4) {
      return { sendHelp: true, command: this, message };
    }

    // Parse channels
    const channelResult: { result: boolean; parsedIDs: string[] } = await ManageLockdownSet.parseChannels(args[1], message.guild!);
    if (!channelResult.result) {
      await CommandUtils.sendMessage('One or more of the channels given was incorrect.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Parse roles
    const rolesResult = await ManageLockdownSet.parseRoles(args[2], message.guild!);
    if (!rolesResult.result) {
      await CommandUtils.sendMessage('One or more of the roles given was incorrect.', message.channel, bot);
      return { sendHelp: false, command: this, message };
    }

    // Parse grant/neutral
    let grant = false;
    if (args[3] === 'grant') {
      grant = true;
    }

    // Make LockdownConfig
    const lockdownConfig: LockdownConfigObject = {
      guildID: message.guild!.id,
      channelIDs: channelResult.parsedIDs,
      roleIDs: rolesResult.parsedIDs,
      grant,
      name: args[0],
    };

    // Try to save
    if (!await bot.configs.lockdownConfig.setLockdownPreset(lockdownConfig)) {
      await CommandUtils.sendMessage('Error saving lockdown preset.', message.channel, bot);
    } else {
      await CommandUtils.sendMessage('Lockdown preset saved successfully.', message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }

  private static async parseChannels(channels: string, guild: Guild): Promise<{ result: boolean; parsedIDs: string[] }> {
    const splitChannels: string[] = channels.split(',');

    let result = true;
    const parsedIDs: string[] = [];
    splitChannels.every(async (givenChannel) => {
      const parsedID: string | undefined = await CommandUtils.parseChannelID(givenChannel);
      // Make sure valid channel
      if (!parsedID || !guild.channels.resolve(parsedID)) {
        result = false;
        return false;
      }

      parsedIDs.push(parsedID);

      return true;
    });

    return { result, parsedIDs };
  }

  private static async parseRoles(roles: string, guild: Guild): Promise<{ result: boolean; parsedIDs: string[] }> {
    const splitRoles: string[] = roles.split(',');

    let result = true;
    const parsedIDs: string[] = [];
    splitRoles.every(async (givenRole) => {
      const parsedRole: Role | null = await CommandUtils.parseRole(givenRole, guild);
      // Make sure valid role
      if (!parsedRole) {
        result = false;
        return false;
      }

      parsedIDs.push(parsedRole.id);
      return true;
    });

    return { result, parsedIDs };
  }
}

class ManageLockdownRemove extends Command {
  constructor(group: CommandGroup, bot: Bot) {
    super('remove', PermissionLevel.Mod, 'Removes given lockdown preset', bot, {
      usage: '<preset>', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group, aliases: ['rem', 'del', 'delete'],
    });
  }

  async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
    if (args.length < 1) {
      return { sendHelp: true, command: this, message };
    }

    // Try to delete
    if (await bot.configs.lockdownConfig.removeLockdownPreset(message.guild!.id, args[0])) {
      await CommandUtils.sendMessage(`Lockdown preset ${args[0]} removed successfully.`, message.channel, bot);
    } else {
      await CommandUtils.sendMessage(`Error removing lockdown preset ${args[0]}, does it exist?`, message.channel, bot);
    }

    return { sendHelp: false, command: this, message };
  }
}

export class ManageLockdown extends CommandGroup {
  constructor(bot: Bot) {
    super('managelockdown', 'Manages lockdown presets', bot, { runsInDm: false });

    this.registerSubCommands(bot);
  }

  protected registerSubCommands(bot: Bot): void {
    this.registerSubCommand(new ManageLockdownList(this, bot));
    this.registerSubCommand(new ManageLockdownInfo(this, bot));
    this.registerSubCommand(new ManageLockdownSet(this, bot));
    this.registerSubCommand(new ManageLockdownRemove(this, bot));
  }
}
