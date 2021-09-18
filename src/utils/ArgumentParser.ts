import type { CommandContext } from 'CommandContext';
import type { CommandArgument, CommandParsedType } from 'commands/Command';

export class ArgumentParser {
  private static argsRegex = /((["'])((?:.(?!\2))*.?)\2)|(\S+)/g;

  public static async parseArgs(content: string, argsList: CommandArgument[], ctx: CommandContext): Promise<CommandParsedType[] | undefined> {
    let allRequired = true;
    const parsedArgs: CommandParsedType[] = [];
    const splitArgs = [...content.matchAll(ArgumentParser.argsRegex)];
    let currStr;
    let currParsedArg;
    // Use every to short circuit on first fail
    for (let i = 0; i < argsList.length; i += 1) {
      if (splitArgs.length <= i && !argsList[i].optional) {
        allRequired = false;
        break;
      }

      // Match either space separated or quote separated
      // This could potentially be cleaned with a better RegEx
      currStr = splitArgs[i][4] ? splitArgs[i][4] : splitArgs[i][3];

      switch (argsList[i].type) {
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

      if (currParsedArg === undefined && !argsList[i].optional) {
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
