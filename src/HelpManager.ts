import { PantherBot } from "./Bot";
import { Message, MessageEmbed } from "discord.js";
import { Command, PermissionLevel } from "./commands/Command";
import { PermissionsHelper } from "./utils/PermissionsHelper";
import { CommandUtils } from "./utils/CommandUtils";
import { CommandGroup } from "./commands/CommandGroup";

export class HelpManager {
    public async sendCommandHelp(command: Command, message: Message, bot: PantherBot, extraArgs?: string[]) {
        //If we need to grab a subcommand, do so
        if(extraArgs) {
            command = await this.getSubCommand(command, extraArgs, message, bot);
        }

        let helpMessage: string = "";
        let isDm: boolean;
        let permLevel: PermissionLevel;

        //Get perms and is DM
        if(message.guild) {
            isDm = false;
            permLevel = await PermissionsHelper.getMemberPermLevel(message.member, bot);
        }
        else {
            isDm = true;
            permLevel = await PermissionsHelper.getUserPermLevel(message.author, bot);
        }

        if(permLevel < command.permLevel || (isDm && !command.runsInDm)) {
            return;
        }

        //Build help message
        helpMessage = `Usage: \`${await bot.config.getPrefix()}${command.fullName} ${command.usage}\`\n\n`;
        helpMessage += command.longDesc;

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(message.channel))
            .setDescription(helpMessage)
            .setTitle(await bot.config.getPrefix() + command.fullName)
            .setTimestamp(Date.now());
        
            await message.channel.send(embed);
    }

    public async sendFullHelp(message: Message, bot: PantherBot) {
        let commandList: Command[] = await bot.commandManager.getAllCommands();
        let helpMessage: string = "";
        let isDm: boolean;
        let permLevel: PermissionLevel;

        //Get perms and is DM
        if(message.guild) {
            isDm = false;
            permLevel = await PermissionsHelper.getMemberPermLevel(message.member, bot);
        }
        else {
            isDm = true;
            permLevel = await PermissionsHelper.getUserPermLevel(message.author, bot);
        }

        //Build string
        for(let command of commandList) {
            if(permLevel >= command.permLevel && (!isDm || command.runsInDm)) {
                helpMessage += `\`${command.name}\` - ${command.desc}\n`;
            }
        }

        //Build embed
        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(message.channel))
            .setTitle("Help")
            .setDescription(helpMessage)
            .setTimestamp(Date.now());

        await message.channel.send(embed);
    }

    private async getSubCommand(command: Command, extraArgs: string[], message: Message, bot: PantherBot): Promise<Command> {
        let subCommand: Command = undefined;

        for(let i: number = 0; i < extraArgs.length; i++) {
            if(command as CommandGroup) {
                subCommand = await (command as CommandGroup).getSubCommand(extraArgs[i]);
            }
            if(!subCommand) {
                break;
            }
            command = subCommand;
        }

        return(command);
    }
}