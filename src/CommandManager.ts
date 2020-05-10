import { Command, PermissionLevel, CommandResult } from "./commands/Command";
import * as commands from "./commands";
import { PantherBot } from "./Bot";

import { Message, MessageEmbed } from "discord.js";
import { CommandUtils } from "./utils/CommandUtils";
import { PermissionsHelper } from "./utils/PermissionsHelper";
import { CommandGroup } from "./commands/CommandGroup";
import { LogLevel } from "./Logger";

export class CommandManager {
    private commandMap: Map<string, Command>;
    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.commandMap = new Map<string, Command>();
        this.registerAll();
    }

    public async parseCommand(message: Message) {
        //Handle partial events
        try {
            if(message.partial) {
                await message.fetch();
            }
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.WARNING, "CommandManager:parseCommand Error fetching message.", err);
            return;
        }

        let prefix: string = this.bot.config.prefix;

        //Ignore bot and system messages
        if(message.author.bot || message.system) {
            return;
        }

        //Make sure we have prefix
        if(!message.content.startsWith(prefix)) {
            return;
        }

        //Split args, find command
        let args: string[] = await CommandUtils.splitCommandArgs(message.content, prefix.length);
        let command: Command = await this.getCommand(args.shift());
        //If command not found, exit
        if(command === undefined) {
            return;
        }

        //Check perms/in DM and run
        if(await PermissionsHelper.checkPermsAndDM(message, command, this.bot)) {
            try {
                let result: CommandResult = await command.run(this.bot, message, args);
                if(result.sendHelp) {
                    await this.bot.helpManager.sendCommandHelp(result.command, result.message, this.bot);
                }
            }
            catch(err) {
                await this.bot.logger.log(LogLevel.ERROR, `CommandManager:parseCommand Error running command "${command.fullName}".`, err);
                await message.channel.send((new MessageEmbed)
                    .setColor(0xFF0000)
                    .setTitle("❌ Error running command.")
                    .setTimestamp(Date.now()));
            }
        }
    }

    public async parseSubCommand(group: CommandGroup, args: string[], message: Message, bot: PantherBot): Promise<CommandResult> {
        //Find command
        let command: Command = await this.getCommandHelper(args.shift(), group.subCommands);
        //If command not found, exit
        if(command === undefined) {
            return {sendHelp: true, command: group, message: message};
        }

        //Check perms/in DM and run
        if(await PermissionsHelper.checkPermsAndDM(message, command, bot)) {
            return await command.run(bot, message, args);
        }

        return {sendHelp: false, command: null, message: message};
    }

    public async getCommand(commandToGet: string): Promise<Command> {
        return(await this.getCommandHelper(commandToGet, this.commandMap));
    }
    
    public async getAllCommands(): Promise<Command[]> {
        return(Array.from(this.commandMap.values()));
    }
    
    private registerCommand(command: Command) {
        this.commandMap.set(command.name, command);
    }

    private registerAll(): void {
        for(let command of Object.values(commands)) {
            this.registerCommand(new command(this.bot));
        }
    }

    private async getCommandHelper(commandToGet: string, commandList: Map<string, Command>): Promise<Command> {
        if(commandList.has(commandToGet)) {
            return(commandList.get(commandToGet));
        }
        else {
            return(undefined);
        }
    }
}