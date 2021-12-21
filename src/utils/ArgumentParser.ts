import type { Bot } from "Bot";
import type { Command, CommandParsedType } from "commands/Command";
import { CommandGroup } from "commands/CommandGroup";
import { CacheType, Channel, CommandInteractionOptionResolver, Guild, Role } from "discord.js";
import { Logger } from "Logger";

export class ArgumentParser {
    // Splits on space but keeps quoted strings together
    private static argsRegex = /((["'])((?:.(?!\2))*.?)\2)|(\S+)/g;

    public static async parseArgs(
        content: string,
        command: Command | CommandGroup,
        bot: Bot,
        guild?: Guild
    ): Promise<{ command: Command; args: CommandParsedType[] | undefined }> {
        const splitArgs = [...content.matchAll(ArgumentParser.argsRegex)];
        return await ArgumentParser.parseArgsRecurse(splitArgs, command, bot, guild);
    }

    private static async parseArgsRecurse(
        args: RegExpMatchArray[],
        command: Command | CommandGroup,
        bot: Bot,
        guild?: Guild
    ): Promise<{ command: Command; args: CommandParsedType[] | undefined }> {
        if (command instanceof CommandGroup) {
            return ArgumentParser.parseSubCommandArgs(args, command, bot, guild);
        }
        return {
            command: command,
            args: await ArgumentParser.parseCommandArgs(args, command, bot, guild),
        };
    }

    private static async parseSubCommandArgs(
        args: RegExpMatchArray[],
        command: CommandGroup,
        bot: Bot,
        guild?: Guild
    ): Promise<{ command: Command; args: CommandParsedType[] | undefined }> {
        if (args.length === 0) {
            return { command: command, args: undefined };
        }

        let currStr = args[0][4] ? args[0][4] : args[0][3];
        let subcommand = command.getSubCommand(currStr);

        if (!subcommand) {
            return { command: command, args: undefined };
        }

        if (!subcommand.args && !(subcommand instanceof CommandGroup)) {
            return { command: subcommand, args: [] };
        }

        return ArgumentParser.parseArgsRecurse(args.slice(1), subcommand, bot, guild);
    }

    private static async parseCommandArgs(
        args: RegExpMatchArray[],
        command: Command,
        bot: Bot,
        guild?: Guild
    ): Promise<CommandParsedType[] | undefined> {
        let allRequired = true;
        const parsedArgs: CommandParsedType[] = [];
        let currStr;
        let currParsedArg;

        if (!command.args) {
            return [];
        }

        // Use every to short circuit on first fail
        // TODO: Restrict to choices if choices defined
        for (let i = 0; i < command.args.length; i += 1) {
            if (args.length <= i) {
                if (!command.args[i].optional) {
                    allRequired = false;
                }
                break;
            }

            // Match either space separated or quote separated
            // This could potentially be cleaned with a better RegEx
            currStr = args[i][4] ? args[i][4] : args[i][3];

            switch (command.args[i].type) {
                case "string":
                    currParsedArg = currStr;
                    break;
                case "int":
                    currParsedArg = parseInt(currStr);
                    if (Number.isNaN(currParsedArg)) currParsedArg = undefined;
                    break;
                case "number":
                    currParsedArg = Number(currStr);
                    if (Number.isNaN(currParsedArg)) currParsedArg = undefined;
                    break;
                case "bool":
                    if (currStr.toLowerCase() === "true") currParsedArg = true;
                    else if (currStr.toLowerCase() === "false") currParsedArg = false;
                    else currParsedArg = undefined;
                    break;
                case "user":
                    // eslint-disable-next-line no-await-in-loop
                    currParsedArg = await bot.utils.parseUser(currStr);
                    break;
                case "channel":
                    // eslint-disable-next-line no-await-in-loop
                    currParsedArg = await bot.utils.parseChannel(currStr);
                    if (currParsedArg === null) currParsedArg = undefined;
                    break;
                case "role":
                    // eslint-disable-next-line no-await-in-loop
                    if (guild) currParsedArg = await bot.utils.parseRole(currStr, guild);
                    if (currParsedArg === null) currParsedArg = undefined;
                    break;
                default:
                    currParsedArg = undefined;
                    break;
            }

            if (currParsedArg === undefined && !command.args[i].optional) {
                allRequired = false;
                break;
            } else {
                parsedArgs.push(currParsedArg);
            }
        }

        // If we do not have all required arguments, return undefined
        if (!allRequired) {
            return undefined;
        }
        return parsedArgs;
    }

    public static async parseSlashArgs(
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
        cmd: Command
    ): Promise<CommandParsedType[] | undefined> {
        if (!cmd.args) {
            return [];
        }

        const parsedArgs: CommandParsedType[] = [];
        let currArg: CommandParsedType;
        // Get args in order, we know that we have all required
        try {
            for (let arg of cmd.args) {
                switch (arg.type) {
                    case "string":
                        currArg = options.getString(arg.name, !arg.optional) ?? undefined;
                        break;
                    case "int":
                        currArg = options.getInteger(arg.name, !arg.optional) ?? undefined;
                        break;
                    case "number":
                        currArg = options.getNumber(arg.name, !arg.optional) ?? undefined;
                        break;
                    case "bool":
                        currArg = options.getBoolean(arg.name, !arg.optional) ?? undefined;
                        break;
                    case "user":
                        currArg = options.getUser(arg.name, !arg.optional) ?? undefined;
                        break;
                    case "channel":
                        let channel = options.getChannel(arg.name, !arg.optional) ?? undefined;
                        if (!(channel instanceof Channel) && channel !== undefined) {
                            Logger.getLogger(this).warning("We got an APIChannel", channel);
                            return undefined;
                        }
                        currArg = channel;
                        break;
                    case "role":
                        currArg = (options.getRole(arg.name, !arg.optional) as Role) ?? undefined;
                        break;
                    default:
                        currArg = undefined;
                }

                if (!currArg) {
                    break;
                }
                parsedArgs.push(currArg);
            }
        } catch (e) {
            Logger.getLogger(this).warning("A required arg was not found in a slash command", e);
        }

        return parsedArgs;
    }
}
