import type { Bot } from 'Bot';
import { Command, PermissionLevel } from 'commands/Command';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import { CommandUtils } from 'utils/CommandUtils';
import { CommandGroup } from 'commands/CommandGroup';

import {
  Message, MessageEmbed, GuildMember, User, Permissions,
} from 'discord.js';

export class HelpManager {
  public static async sendCommandHelp(command: Command, message: Message, bot: Bot, extraArgs?: string[]) {
    // If we need to grab a subcommand, do so
    let commandToHelp: Command = command;
    if (extraArgs) {
      commandToHelp = await HelpManager.getSubCommand(command, extraArgs);
    }

    let helpMessage = '';
    const prefix: string | undefined = await bot.commandManager.getPrefix(message.guild ? message.guild.id : undefined);

    // Get perms and is DM
    if (!await PermissionsHelper.checkPermsAndDM(message.member ? message.member : message.author, command, bot)) {
      return;
    }

    // Build help message
    if (commandToHelp.aliases.length > 0) {
      helpMessage += `Aliases: \`${commandToHelp.aliases.join('`, `')}\`\n`;
    }
    helpMessage += `Usage: \`${prefix}${commandToHelp.fullName}`;
    if (commandToHelp.usage.length > 0) {
      helpMessage += ` ${commandToHelp.usage}`;
    }
    helpMessage += `\`\n\n${commandToHelp.desc}`;
    if (commandToHelp.longDesc !== '') {
      helpMessage += `\n\n${commandToHelp.longDesc}`;
    }
    helpMessage += '`';

    if (commandToHelp instanceof CommandGroup) {
      const subCommands: Command[] = await HelpManager.getSubCommandsWithPerms(message.member ? message.member : message.author, commandToHelp, bot);

      if (subCommands.length > 0) {
        helpMessage += '\n\nSub Commands:\n';
      }

      subCommands.forEach((subCommand) => {
        helpMessage += `• \`${subCommand.name}\` - ${subCommand.desc}\n`;
      });
    }

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setColor(await CommandUtils.getSelfColor(message.channel, bot))
      .setDescription(helpMessage)
      .setTitle(prefix + commandToHelp.fullName)
      .setTimestamp(Date.now());

    if (!(commandToHelp instanceof CommandGroup)) {
      if (commandToHelp.permLevel > PermissionLevel.Everyone) {
        embed.addField('Bot Permission', PermissionLevel[commandToHelp.permLevel], true);
      }

      if (commandToHelp.requiredPerm) {
        embed.addField('Required Permission', await PermissionsHelper.getString(new Permissions(command.requiredPerm)), true);
      }
    }

    await message.channel.send({ embeds: [embed], reply: { messageReference: message } });
  }

  public static async sendFullHelp(message: Message, bot: Bot) {
    const commandList: Command[] = await bot.commandManager.getAllCommands();
    let helpMessage = '';

    // Build string
    commandList.forEach(async (command) => {
      if (await PermissionsHelper.checkPermsAndDM(message.member ? message.member : message.author, command, bot)) {
        helpMessage += `\`${command.name}\` - ${command.desc}\n`;
      }
    });

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setColor(await CommandUtils.getSelfColor(message.channel, bot))
      .setTitle('Help')
      .setDescription(helpMessage)
      .setTimestamp(Date.now());

    await message.channel.send({ embeds: [embed], reply: { messageReference: message } });
  }

  private static async getSubCommand(command: Command, extraArgs: string[]): Promise<Command> {
    let subCommand: Command | undefined;

    for (let i = 0; i < extraArgs.length; i += 1) {
      if (command as CommandGroup) {
        subCommand = (command as CommandGroup).getSubCommand(extraArgs[i]);
      }

      if (!subCommand) {
        break;
      }
    }

    if (subCommand) {
      return subCommand;
    }
    return command;
  }

  private static async getSubCommandsWithPerms(user: User | GuildMember, group: CommandGroup, bot: Bot): Promise<Command[]> {
    const subCommands: Command[] = Array.from(group.subCommands.values());
    const subCommandsWithPerms: Command[] = [];

    subCommands.forEach(async (subCommand) => {
      if (!subCommandsWithPerms.includes(subCommand) && await PermissionsHelper.checkPermsAndDM(user, subCommand, bot)) {
        subCommandsWithPerms.push(subCommand);
      }
    });

    return subCommandsWithPerms;
  }
}
