import type { CommandContext } from 'CommandContext';
import type { Command, CommandParsedType } from 'commands/Command';
import { CommandGroup } from 'commands/CommandGroup';

export class ArgumentParser {
  // Splits on space but keeps quoted strings together
  private static argsRegex = /((["'])((?:.(?!\2))*.?)\2)|(\S+)/g;

  public static async parseArgs(content: string, command: Command | CommandGroup, ctx: CommandContext): Promise<{ command: Command, args: CommandParsedType[] | undefined }> {
    const splitArgs = [...content.matchAll(ArgumentParser.argsRegex)];
    return await ArgumentParser.parseArgsRecurse(splitArgs, command, ctx);
  }

  private static async parseArgsRecurse(args: RegExpMatchArray[], command: Command | CommandGroup, ctx: CommandContext): Promise<{ command: Command, args: CommandParsedType[] | undefined }> {
    if (command instanceof CommandGroup) {
      return ArgumentParser.parseSubCommandArgs(args, command, ctx);
    }
    return { command: command, args: await ArgumentParser.parseCommandArgs(args, command, ctx) };
  }

  private static async parseSubCommandArgs(args: RegExpMatchArray[], command: CommandGroup, ctx: CommandContext): Promise<{ command: Command, args: CommandParsedType[] | undefined }> {
    if (args.length === 0) {
      return { command: command, args: undefined };
    }

    let currStr = args[0][4] ? args[0][4] : args[0][3];
    let subcommand = command.getSubCommand(currStr);

    if (!subcommand) {
      return { command: command, args: undefined };
    }

    if (!subcommand.args) {
      return { command: subcommand, args: [] };
    }

    return ArgumentParser.parseArgsRecurse(args.slice(1), subcommand, ctx);
  }

  private static async parseCommandArgs(args: RegExpMatchArray[], command: Command, ctx: CommandContext): Promise<CommandParsedType[] | undefined> {
    let allRequired = true;
    const parsedArgs: CommandParsedType[] = [];
    let currStr;
    let currParsedArg;

    if (!command.args) {
      return [];
    }

    // Use every to short circuit on first fail
    for (let i = 0; i < command.args.length; i += 1) {
      if (args.length <= i && !command.args[i].optional) {
        allRequired = false;
        break;
      }

      // Match either space separated or quote separated
      // This could potentially be cleaned with a better RegEx
      currStr = args[i][4] ? args[i][4] : args[i][3];

      switch (command.args[i].type) {
        case 'string':
          currParsedArg = currStr;
          break;
        case 'int':
          currParsedArg = parseInt(currStr);
          if (Number.isNaN(currParsedArg)) currParsedArg = undefined;
          break;
        case 'number':
          currParsedArg = Number(currStr);
          if (Number.isNaN(currParsedArg)) currParsedArg = undefined;
          break;
        case 'bool':
          if (currStr.toLowerCase() === 'true') currParsedArg = true;
          else if (currStr.toLowerCase() === 'false') currParsedArg = false;
          else currParsedArg = undefined;
          break;
        case 'user':
          // eslint-disable-next-line no-await-in-loop
          currParsedArg = await ctx.bot.utils.parseUser(currStr);
          break;
        case 'channel':
          // eslint-disable-next-line no-await-in-loop
          currParsedArg = await ctx.bot.utils.parseChannel(currStr);
          if (currParsedArg === null) currParsedArg = undefined;
          break;
        case 'role':
          // eslint-disable-next-line no-await-in-loop
          if (ctx.guild) currParsedArg = await ctx.bot.utils.parseRole(currStr, ctx.guild);
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
}
