import { Command, PermissionLevel, CommandResult, CommandParameters } from "./Command";
import { PantherBot } from "../Bot";

import { Message, PermissionResolvable, Permissions } from "discord.js";

export abstract class CommandGroup extends Command {
    protected _subCommands: Map<string, Command>;

    constructor(name: string, desc: string, bot: PantherBot, params?: CommandParameters) {
        if(!params) {
            params = <CommandParameters>{};
        }
        params.usage = "<subcommand>";
        super(name, PermissionLevel.Owner, desc, bot, params);
        this._subCommands = new Map<string, Command>();
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        return await bot.commandManager.parseSubCommand(this, args, message, bot);
    }

    public get subCommands(): Map<string, Command> {
        return(this._subCommands);
    }

    public async getSubCommand(arg: string): Promise<Command> {
        return(this._subCommands.get(arg));
    }

    public get permLevel(): PermissionLevel {
        let lowestPerm = PermissionLevel.Owner;
        for(let subCommand of this._subCommands.values()) {
            if(subCommand.permLevel < lowestPerm) {
                lowestPerm = subCommand.permLevel;
            }
            if(lowestPerm === PermissionLevel.Everyone) {
                break;
            }
        }

        return(lowestPerm);
    }

    public get requiredPerm(): PermissionResolvable {
        let perms: Permissions = new Permissions();
        let numWithPerms: number = 0;

        for(let subCommand of this._subCommands.values()) {
            if(subCommand.requiredPerm && !perms.any(subCommand.requiredPerm)) {
                perms.add(subCommand.requiredPerm);
                numWithPerms++;
            }
        }

        if(numWithPerms === 0) {
            perms = undefined;
        }

        return(perms);
    }

    protected registerSubCommand(command: Command) {
        this._subCommands.set(command.name, command);
        for(let alias of command.aliases) {
            this._subCommands.set(alias, command);
        }
    }

    protected abstract registerSubCommands(bot: PantherBot): void;
}