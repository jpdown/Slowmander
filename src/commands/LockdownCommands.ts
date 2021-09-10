// /* eslint-disable max-classes-per-file */
// import { Command, PermissionLevel, CommandResult } from 'commands/Command';
// import { CommandGroup } from 'commands/CommandGroup';
// import type { Bot } from 'Bot';
// import { CommandUtils } from 'utils/CommandUtils';
// import { ReactionPaginator } from 'utils/ReactionPaginator';
// import { LockdownHelper } from 'utils/LockdownHelper';

// import {
//   Message, Permissions, Role, Guild, MessageEmbed,
// } from 'discord.js';

// export class Lockdown extends Command {
//   constructor(bot: Bot) {
//     super(
//       'lockdown', PermissionLevel.Mod, 'Locks down guild', bot,
//       { usage: '[preset]', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false },
//     );
//   }

//   async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
//     try {
//       await LockdownHelper.lockUnlock(bot, message, args, true);
//     } catch (err) {
//       await CommandUtils.sendMessage('Error locking server.', message.channel, bot);
//       await this.logger.error(`Error locking guild ${message.guild!.name}`, err);
//     }

//     return { sendHelp: false, command: this, message };
//   }
// }

// export class Unlock extends Command {
//   constructor(bot: Bot) {
//     super(
//       'unlock', PermissionLevel.Mod, 'Unlocks guild', bot,
//       { usage: '[preset]', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false },
//     );
//   }

//   async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
//     try {
//       await LockdownHelper.lockUnlock(bot, message, args, false);
//     } catch (err) {
//       await CommandUtils.sendMessage('Error unlocking server.', message.channel, bot);
//       await this.logger.error(`Error unlocking guild ${message.guild!.name}`, err);
//     }

//     return { sendHelp: false, command: this, message };
//   }
// }

// class ManageLockdownList extends Command {
//   constructor(group: CommandGroup, bot: Bot) {
//     super('list', PermissionLevel.Mod, 'Lists lockdown presets', bot, { requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group });
//   }

//   async run(bot: Bot, message: Message): Promise<CommandResult> {
//     const lockdownPresets = bot.db.lockdownPresets.getPresetList(message.guild!.id);

//     if (lockdownPresets === null) {
//       await CommandUtils.sendMessage('Error getting from db, please try again later.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }

//     if (!lockdownPresets || lockdownPresets.length < 1) {
//       await CommandUtils.sendMessage('No presets found.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }

//     // Make paginator
//     const paginator = new ReactionPaginator(lockdownPresets, 10, `Lockdown presets in guild ${message.guild!.name}`, message.channel, bot, this);
//     await paginator.postMessage();

//     return { sendHelp: false, command: this, message };
//   }
// }

// class ManageLockdownInfo extends Command {
//   constructor(group: CommandGroup, bot: Bot) {
//     super('info', PermissionLevel.Mod, 'Gives information on specific lockdown preset', bot, {
//       usage: '<preset>', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group,
//     });
//   }

//   async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
//     if (args.length < 1) {
//       return { sendHelp: true, command: this, message };
//     }

//     const guildId = message.guild!.id;

//     const lockdownPreset = bot.db.lockdownPresets.getPreset(guildId, args[0]);
//     const lockdownChannels = bot.db.lockdownPresets.getPresetChannels(guildId, args[0]);
//     const lockdownRoles = bot.db.lockdownPresets.getPresetRoles(guildId, args[0]);

//     if (lockdownPreset === undefined) {
//       return { sendHelp: true, command: this, message };
//     }

//     if (!lockdownPreset || !lockdownChannels || !lockdownRoles) {
//       await CommandUtils.sendMessage('There was an error with the database, please try again later.', message.channel, bot, message);
//       return { sendHelp: false, command: this, message };
//     }

//     // Make lists
//     const channelList: string[] = [];
//     lockdownChannels.forEach((channel) => {
//       channelList.push(`<#${channel}>`);
//     });
//     const roleList: string[] = [];
//     lockdownRoles.forEach((role) => {
//       roleList.push(`<@&${role}>`);
//     });

//     // Make info embed
//     const embed = new MessageEmbed()
//       .setTitle(`Lockdown Preset ${lockdownPreset.preset}`)
//       .addField('Permission Set To', lockdownPreset.grant ? 'Grant' : 'Neutral')
//       .setColor(await CommandUtils.getSelfColor(message.channel, bot));
//     await message.reply({ embeds: [embed] });

//     // Make paginators
//     const channelPaginator = new ReactionPaginator(
//       channelList, 10,
//       `Channels in lockdown preset ${lockdownPreset.preset}`,
//       message.channel, bot, this,
//     );
//     await channelPaginator.postMessage();
//     const rolePaginator = new ReactionPaginator(roleList, 10, `Roles in lockdown preset ${lockdownPreset.preset}`, message.channel, bot, this);
//     await rolePaginator.postMessage();

//     return { sendHelp: false, command: this, message };
//   }
// }

// class ManageLockdownSet extends Command {
//   constructor(group: CommandGroup, bot: Bot) {
//     super('set', PermissionLevel.Mod, 'Sets lockdown preset channels and roles', bot, {
//       usage: '<preset> <channel,...> <role,...> <grant/neutral>', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group,
//     });
//   }

//   async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
//     if (args.length < 4) {
//       return { sendHelp: true, command: this, message };
//     }

//     // Parse channels
//     const channelResult: { result: boolean; parsedIDs: string[] } = await ManageLockdownSet.parseChannels(args[1], message.guild!);
//     if (!channelResult.result) {
//       await CommandUtils.sendMessage('One or more of the channels given was incorrect.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }

//     // Parse roles
//     const rolesResult = await ManageLockdownSet.parseRoles(args[2], message.guild!);
//     if (!rolesResult.result) {
//       await CommandUtils.sendMessage('One or more of the roles given was incorrect.', message.channel, bot);
//       return { sendHelp: false, command: this, message };
//     }

//     // Parse grant/neutral
//     let grant = false;
//     if (args[3] === 'grant') {
//       grant = true;
//     }

//     // Try to save
//     if (!bot.db.lockdownPresets.setPreset(message.guild!.id, args[0], grant, channelResult.parsedIDs, rolesResult.parsedIDs)) {
//       await CommandUtils.sendMessage('Error saving lockdown preset.', message.channel, bot);
//     } else {
//       await CommandUtils.sendMessage('Lockdown preset saved successfully.', message.channel, bot);
//     }

//     return { sendHelp: false, command: this, message };
//   }

//   private static async parseChannels(channels: string, guild: Guild): Promise<{ result: boolean; parsedIDs: string[] }> {
//     const splitChannels: string[] = channels.split(',');

//     let result = true;
//     const parsedIDs: string[] = [];
//     splitChannels.every(async (givenChannel) => {
//       const parsedID: string | undefined = await CommandUtils.parseChannelID(givenChannel);
//       // Make sure valid channel
//       if (!parsedID || !guild.channels.resolve(parsedID)) {
//         result = false;
//         return false;
//       }

//       parsedIDs.push(parsedID);

//       return true;
//     });

//     return { result, parsedIDs };
//   }

//   private static async parseRoles(roles: string, guild: Guild): Promise<{ result: boolean; parsedIDs: string[] }> {
//     const splitRoles: string[] = roles.split(',');

//     let result = true;
//     const parsedIDs: string[] = [];
//     splitRoles.every(async (givenRole) => {
//       const parsedRole: Role | null = await CommandUtils.parseRole(givenRole, guild);
//       // Make sure valid role
//       if (!parsedRole) {
//         result = false;
//         return false;
//       }

//       parsedIDs.push(parsedRole.id);
//       return true;
//     });

//     return { result, parsedIDs };
//   }
// }

// class ManageLockdownRemove extends Command {
//   constructor(group: CommandGroup, bot: Bot) {
//     super('remove', PermissionLevel.Mod, 'Removes given lockdown preset', bot, {
//       usage: '<preset>', requiredPerm: Permissions.FLAGS.MANAGE_CHANNELS, runsInDm: false, group, aliases: ['rem', 'del', 'delete'],
//     });
//   }

//   async run(bot: Bot, message: Message, args: string[]): Promise<CommandResult> {
//     if (args.length < 1) {
//       return { sendHelp: true, command: this, message };
//     }

//     // Try to delete
//     if (bot.db.lockdownPresets.removePreset(message.guild!.id, args[0])) {
//       await CommandUtils.sendMessage(`Lockdown preset ${args[0]} removed successfully.`, message.channel, bot);
//     } else {
//       await CommandUtils.sendMessage(`Error removing lockdown preset ${args[0]}, does it exist?`, message.channel, bot);
//     }

//     return { sendHelp: false, command: this, message };
//   }
// }

// export class ManageLockdown extends CommandGroup {
//   constructor(bot: Bot) {
//     super('managelockdown', 'Manages lockdown presets', bot, { runsInDm: false });

//     this.registerSubCommands(bot);
//   }

//   protected registerSubCommands(bot: Bot): void {
//     this.registerSubCommand(new ManageLockdownList(this, bot));
//     this.registerSubCommand(new ManageLockdownInfo(this, bot));
//     this.registerSubCommand(new ManageLockdownSet(this, bot));
//     this.registerSubCommand(new ManageLockdownRemove(this, bot));
//   }
// }
