import type { CommandArg } from "commands/Command";

class ArgumentParser {
  public static async parseArgs(content: string, types: CommandArg[]): any[] {
    const parsedArgs = [];
    let remainingContent: string = content;
    // Use every to short circuit on first fail
    types.every((arg) => {
      const type: CommandArg = arg.endsWith('?') ? arg.slice(0, -1) as CommandArg : arg;
      switch (type) {
        case 'string':
          break;
        case 'int':
          break;
        case 'float':
          break;
        case 'bool':
          break;
        case 'user':
          break;
        case 'channel':
          break;
        case 'role':
          break;
        case 'mentionable':
          break;
        default:
          break;
      }
    });
  }

  private static parseString(content: string, optional: boolean): { parsedString: string | undefined, remainingContent: string } {
    
  }
}