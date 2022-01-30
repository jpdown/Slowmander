import type { Bot } from "Bot";
import type { Command, CommandArgumentType, CommandParsedType } from "commands/Command";
import { CommandGroup } from "commands/CommandGroup";
import {
    CacheType,
    Channel,
    CommandInteractionOptionResolver,
    Guild,
    GuildManager,
    GuildMember,
    Role,
} from "discord.js";
import { Logger } from "Logger";
import { CommandUtils } from "./CommandUtils";

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
        let currArg;
        let type: CommandArgumentType;

        if (!command.args) {
            return [];
        }

        // Use every to short circuit on first fail
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
            currArg = command.args[i];
            type = currArg.type;

            switch (type) {
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
                    currParsedArg = await CommandUtils.parseUser(currStr);
                    break;
                case "channel":
                    // eslint-disable-next-line no-await-in-loop
                    currParsedArg = await CommandUtils.parseChannel(currStr);
                    if (currParsedArg === null) currParsedArg = undefined;
                    break;
                case "role":
                    // eslint-disable-next-line no-await-in-loop
                    if (guild) currParsedArg = await CommandUtils.parseRole(currStr, guild);
                    if (currParsedArg === null) currParsedArg = undefined;
                    break;
                case "member":
                    if (guild) currParsedArg = await CommandUtils.parseMember(currStr, guild);
                    if (currParsedArg === null) currParsedArg = undefined;
                    break;
                case "emoji":
                    if (guild) currParsedArg = await CommandUtils.parseEmote(currStr);
                    if (currParsedArg === null) currParsedArg = undefined;
                    break;
                default:
                    const exhaustiveCheck: never = type;
                    throw new Error('Unhandled arg type: ' + exhaustiveCheck);
            }

            if ("choices" in currArg && !currArg.choices?.map((v) => v.value).includes(currParsedArg as string | number)) {
                currParsedArg = undefined;
            }

            if (currParsedArg === undefined && !currArg.optional) {
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
        let type: CommandArgumentType;
        // Get args in order, we know that we have all required
        try {
            for (let arg of cmd.args) {
                type = arg.type;
                switch (type) {
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
                        let role = options.getRole(arg.name, !arg.optional) ?? undefined;
                        if (!(role instanceof Role) && role !== undefined) {
                            Logger.getLogger(this).warning("We got an APIRole", role);
                            return undefined;
                        }
                        currArg = role;
                        break;
                    case "member":
                        let member = options.getMember(arg.name, !arg.optional) ?? undefined;
                        if (!(member instanceof GuildMember) && member !== undefined) {
                            Logger.getLogger(this).warning("We got an APIGuildMember", member);
                            return undefined;
                        }
                        currArg = member;
                        break;
                    case "emoji":
                        let emoteId = options.getString(arg.name, !arg.optional);
                        if (!emoteId) {
                            return undefined;
                        }
                        currArg = await CommandUtils.parseEmote(emoteId) ?? undefined;
                        break;
                    default:
                        const exhaustiveCheck: never = type;
                        throw new Error('Unhandled arg type: ' + exhaustiveCheck);
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
