import { Command, CommandResult } from "./commands/Command";
import * as commands from "./commands";
import { PantherBot } from "./Bot";

import { Message, MessageEmbed, Snowflake } from "discord.js";
import { CommandUtils } from "./utils/CommandUtils";
import { PermissionsHelper } from "./utils/PermissionsHelper";
import { CommandGroup } from "./commands/CommandGroup";
import { Logger } from "./Logger";

export class CommandManager {
    private commandMap: Map<string, Command>;
    private prefixMap: Map<Snowflake, string>;
    private bot: PantherBot;
    private logger: Logger;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
        this.commandMap = new Map<string, Command>();
        this.prefixMap = new Map<Snowflake, string>();
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
            await this.logger.warning("Error fetching message.", err);
            return;
        }

        let prefix: string;

        if(message.guild) {
            prefix = await this.getPrefix(message.guild.id);
        }
        else {
            prefix = await this.getPrefix();
        }

        if(!prefix) return;

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
        if(await PermissionsHelper.checkPermsAndDM(message.member ? message.member : message.author, command, this.bot)) {
            try {
                let result: CommandResult = await command.run(this.bot, message, args);
                if(result.sendHelp) {
                    await this.bot.helpManager.sendCommandHelp(result.command, result.message, this.bot);
                }
            }
            catch(err) {
                await this.logger.error(`Error running command "${command.fullName}".`, err);
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
        if(await PermissionsHelper.checkPermsAndDM(message.member ? message.member : message.author, command, bot)) {
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

    public async getPrefix(guildId?: string): Promise<string> {
        if(guildId) {
            if(this.prefixMap.has(guildId)) {
                return(this.prefixMap.get(guildId));
            }
            else {
                try {
                    let prefix: string = await this.bot.configs.guildConfig.getPrefix(guildId);
                    if(prefix) {
                        this.prefixMap.set(guildId, prefix);
                        return(prefix);
                    }
                }
                catch(err) {
                    await this.logger.error("Error getting guild prefix", err);
                }
            }
        }

        try {
            return(await this.bot.configs.botConfig.getDefaultPrefix());
        }
        catch(err) {
            await this.logger.error("Error getting default prefix", err);
            return(undefined);
        }
    }

    public async setGuildPrefix(guildId: string, newPrefix: string): Promise<boolean> {
        try {
            let result: boolean = await this.bot.configs.guildConfig.setPrefix(guildId, newPrefix);
            if(result) this.prefixMap.set(guildId, newPrefix);
            return(result);
        }
        catch(err) {
            await this.logger.error("Error setting guild prefix.", err);
            return(false);
        }
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