import Bot from 'Bot';
import { Command, PermissionLevel } from 'commands/Command';
import { PermissionsHelper } from 'utils/PermissionsHelper';
import { CommandUtils } from 'utils/CommandUtils';
import { CommandGroup } from 'commands/CommandGroup';

import {
  Message, MessageEmbed, GuildMember, User, Permissions,
} from 'discord.js';

export class HelpManager {
  public async sendCommandHelp(command: Command, message: Message, bot: Bot, extraArgs?: string[]) {
    // If we need to grab a subcommand, do so
    if (extraArgs) {
      command = await this.getSubCommand(command, extraArgs, message, bot);
    }

    let helpMessage = '';
    const prefix: string | undefined = await bot.commandManager.getPrefix(message.guild ? message.guild.id : undefined);

    // Get perms and is DM
    if (!await PermissionsHelper.checkPermsAndDM(message.member ? message.member : message.author, command, bot)) {
      return;
    }

    // Build help message
    if (command.aliases.length > 0) {
      helpMessage += `Aliases: \`${command.aliases.join('`, `')}\`\n`;
    }
    helpMessage += `Usage: \`${prefix}${command.fullName}`;
    if (command.usage.length > 0) {
      helpMessage += ` ${command.usage}`;
    }
    helpMessage += `\`\n\n${command.desc}`;
    if (command.longDesc !=== '') {
      helpMessage += `\n\n${command.longDesc}`;
    }
    helpMessage += '`';

    if (command instanceof CommandGroup) {
      const subCommands: Command[] = await this.getSubCommandsWithPerms(message.member ? message.member : message.author, command, bot);

      if (subCommands.length > 0) {
        helpMessage += '\n\nSub Commands:\n';
      }

      for (const subCommand of subCommands) {
        helpMessage += `• \`${subCommand.name}\` - ${subCommand.desc}\n`;
      }
    }

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setColor(await CommandUtils.getSelfColor(message.channel, bot))
      .setDescription(helpMessage)
      .setTitle(prefix + command.fullName)
      .setTimestamp(Date.now());

    if (!(command instanceof CommandGroup)) {
      if (command.permLevel > PermissionLevel.Everyone) {
        embed.addField('Bot Permission', PermissionLevel[command.permLevel], true);
      }

      if (command.requiredPerm) {
        embed.addField('Required Permission', await PermissionsHelper.getString(new Permissions(command.requiredPerm)), true);
      }
    }

    await message.channel.send({ embeds: [embed], reply: { messageReference: message } });
  }

  public async sendFullHelp(message: Message, bot: Bot) {
    const commandList: Command[] = await bot.commandManager.getAllCommands();
    let helpMessage = '';
    let isDm: boolean;
    let permLevel: PermissionLevel;

    // Build string
    for (const command of commandList) {
      if (await PermissionsHelper.checkPermsAndDM(message.member ? message.member : message.author, command, bot)) {
        helpMessage += `\`${command.name}\` - ${command.desc}\n`;
      }
    }

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setColor(await CommandUtils.getSelfColor(message.channel, bot))
      .setTitle('Help')
      .setDescription(helpMessage)
      .setTimestamp(Date.now());

    await message.channel.send({ embeds: [embed], reply: { messageReference: message } });
  }

  private async getSubCommand(command: Command, extraArgs: string[], message: Message, bot: Bot): Promise<Command> {
    let subCommand: Command | undefined;

    for (let i = 0; i < extraArgs.length; i++) {
      if (command as CommandGroup) {
        subCommand = await (command as CommandGroup).getSubCommand(extraArgs[i]);
      }

      if (!subCommand) {
        break;
      }

      command = subCommand;
    }

    return command;
  }

  private async getSubCommandsWithPerms(user: User | GuildMember, group: CommandGroup, bot: Bot): Promise<Command[]> {
    const subCommands: Command[] = Array.from(group.subCommands.values());
    const subCommandsWithPerms: Command[] = [];

    for (const subCommand of subCommands) {
      if (subCommandsWithPerms.includes(subCommand)) continue;

      if (await PermissionsHelper.checkPermsAndDM(user, subCommand, bot)) {
        subCommandsWithPerms.push(subCommand);
      }
    }

    return subCommandsWithPerms;
  }
}
