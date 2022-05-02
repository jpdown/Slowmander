import { Command } from 'commands/Command';
// import { PermissionsHelper } from 'utils/PermissionsHelper';
import { CommandUtils } from 'utils/CommandUtils';
import { CommandGroup } from 'commands/CommandGroup';

import { MessageEmbed } from 'discord.js';
import { CommandContext } from 'CommandContext';
import { ButtonPaginator } from 'utils/ButtonPaginator';

export class HelpManager {
  public static async sendCommandHelp(command: Command, ctx: CommandContext) {
    let helpMessage = '';
    const prefix: string | undefined = await ctx.bot.commandManager.getPrefix(ctx.guild ? ctx.guild.id : undefined);

    // Get perms and is DM
    // if (!await PermissionsHelper.checkPerms(command, ctx) && (ctx.guild || !command.guildOnly)) {
    //   return;
    // }

    // Build help message
    helpMessage += `Usage: \`${prefix}${command.fullName}`
    if (command.args) {
        for (let arg of command.args) {
            helpMessage += arg.optional ? ` [${arg.name}]` : ` <${arg.name}>`;
        }
    }
    helpMessage += `\`\n\n${command.desc}`;

    if (command instanceof CommandGroup) {
      const subCommands: Command[] = await HelpManager.getSubCommandsWithPerms(command, ctx);

      if (subCommands.length > 0) {
        helpMessage += '\n\nSub Commands:\n';
      }

      subCommands.forEach((subCommand) => {
        helpMessage += `• \`${subCommand.name}\` - ${subCommand.desc}\n`;
      });
    }

    if (command.args && command.args.length > 0) {
        helpMessage += '\n\nArguments:\n';

        command.args.forEach((arg) => {
            helpMessage += `• \`${arg.name}\` - ${arg.description}\n`;
        });
    }

    // Build embed
    const embed: MessageEmbed = new MessageEmbed()
      .setColor(await CommandUtils.getSelfColor(ctx.channel))
      .setDescription(helpMessage)
      .setTitle(prefix + command.fullName)
      .setTimestamp(Date.now());

    if (!(command instanceof CommandGroup)) {
      // if (command.permLevel > PermissionLevel.Everyone) {
      //   embed.addField('Permission', PermissionLevel[command.permLevel], true);
      // }
    }

    await ctx.reply({ embeds: [embed] }, true);
  }

  public static async sendFullHelp(ctx: CommandContext) {
    const commandList: Command[] = ctx.bot.commandManager.getAllCommands();
    let cmds: string[] = [];

    // Build string
    for (let command of commandList) {
      // if (await PermissionsHelper.checkPerms(command, ctx) && (ctx.guild || !command.guildOnly)) {
      //   cmds.push(`\`${command.name}\` - ${command.desc}`);
      // }
    }

    // Build paginator
    const paginator: ButtonPaginator = new ButtonPaginator(
        cmds,
        ctx,
        5,
        "Help"
    );
    await paginator.postMessage();
  }

  private static async getSubCommandsWithPerms(group: CommandGroup, ctx: CommandContext): Promise<Command[]> {
    const subCommands: Command[] = Array.from(group.subCommands.values());
    const subCommandsWithPerms: Command[] = [];

    for (let subCommand of subCommands) {
      // if (await PermissionsHelper.checkPerms(subCommand, ctx) && (ctx.guild || !subCommand.guildOnly)) {
      //   subCommandsWithPerms.push(subCommand);
      // }
    }

    return subCommandsWithPerms;
  }
}
