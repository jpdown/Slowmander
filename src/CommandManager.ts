import { Command, PermissionLevel } from "./commands/Command";
import * as commands from "./commands";
import { PantherBot } from "./Bot";

import { Message } from "discord.js";
import { CommandUtils } from "./utils/CommandUtils";
import { PermissionsHelper } from "./utils/PermissionsHelper";
import { CommandGroup } from "./commands/CommandGroup";

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
            console.log("Error fetching message.", err);
            return;
        }

        let prefix: string = await this.bot.config.getPrefix();

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
        if(await this.checkPermsAndDM(message, command)) {
            await command.run(this.bot, message, args);
        }
    }

    public async parseSubCommand(group: CommandGroup, args: string[], message: Message, bot: PantherBot) {
        //Find command
        let command: Command = await this.getCommandHelper(args.shift(), group.subCommands);
        //If command not found, exit
        if(command === undefined) {
            return;
        }

        //Check perms/in DM and run
        if(await this.checkPermsAndDM(message, command)) {
            await command.run(bot, message, args);
        }
    }

    public registerCommand(command: Command) {
        this.commandMap.set(command.name, command);
    }

    public async getCommand(commandToGet: string): Promise<Command> {
        return(await this.getCommandHelper(commandToGet, this.commandMap));
    }

    private registerAll(): void {
        for(let command of Object.values(commands)) {
            this.registerCommand(new command);
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

    private async checkPermsAndDM(message: Message, command: Command): Promise<boolean> {
        let permLevel: PermissionLevel;
        let inDm: boolean = false;
        if(message.member === undefined) {
            permLevel = await PermissionsHelper.getUserPermLevel(message.author, this.bot);
            inDm = true;
        }
        else {
            permLevel = await PermissionsHelper.getMemberPermLevel(message.member, this.bot)
        }

        return(permLevel >= command.permLevel && (!inDm || command.runsInDm));
    }
}