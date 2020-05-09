import { Command, PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message } from "discord.js";

export abstract class CommandGroup extends Command {
    protected _subCommands: Map<string, Command>;

    constructor(name: string, permLevel: PermissionLevel, desc: string, runsInDm: boolean, group?: CommandGroup) {
        super(name, permLevel, desc, "<subcommand>", runsInDm, group);
        this._subCommands = new Map<string, Command>();
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        await bot.commandManager.parseSubCommand(this, args, message, bot);
    }

    public get subCommands(): Map<string, Command> {
        return(this._subCommands);
    }

    protected registerSubCommand(command: Command) {
        this._subCommands.set(command.name, command);
    }

    protected abstract registerSubCommands(): void;
}