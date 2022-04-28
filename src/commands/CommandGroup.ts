import {
    Command,
    CommandOptions,
    PermissionLevel,
} from "commands/Command";

import type { CommandContext } from "CommandContext";

export class CommandGroup extends Command {
    public readonly subCommands: Map<string, Command>;

    constructor(
        name: string,
        desc: string,
        func: (ctx: CommandContext) => Promise<void>,
        permLevel: PermissionLevel,
        options: CommandOptions
    ) {
        super(name, desc, func, permLevel, options);
        this.subCommands = new Map<string, Command>();
    }

    public getSubCommand(arg: string): Command | undefined {
        return this.subCommands.get(arg);
    }

    public registerSubCommand(command: Command): void {
        this.subCommands.set(command.name, command);
    }
}
