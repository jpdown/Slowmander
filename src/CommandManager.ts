import { Command, PermissionLevel } from "./commands/Command";
import * as commands from "./commands";
import { PantherBot } from "./Bot";

import { Message } from "discord.js";
import { CommandUtils } from "./utils/CommandUtils";
import { PermissionsHelper } from "./utils/PermissionsHelper";

export class CommandManager {
    private commandMap: Map<string, Command>;
    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.commandMap = new Map<string, Command>();
        this.registerAll();
    }

    public async parseCommand(message: Message) {
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
        let permLevel: PermissionLevel;
        let inDm: boolean = false;
        if(message.member === undefined) {
            permLevel = await PermissionsHelper.getUserPermLevel(message.author, this.bot);
            inDm = true;
        }
        else {
            permLevel = await PermissionsHelper.getMemberPermLevel(message.member, this.bot)
        }

        if(permLevel >= command.permLevel && (!inDm || command.runsInDm)) {
            await command.run(this.bot, message, args);
        }
    }

    public registerCommand(command: Command) {
        this.commandMap.set(command.name, command);
    }

    public async getCommand(commandToGet: string): Promise<Command> {
        if(this.commandMap.has(commandToGet)) {
            return(this.commandMap.get(commandToGet));
        }
        else {
            return(undefined);
        }
    }

    private registerAll(): void {
        for(let command of Object.values(commands)) {
            this.registerCommand(new command);
        }
    }
}