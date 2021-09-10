import type { CommandContext } from 'CommandContext';
import { command, subcommand } from 'commands/CommandDecorators';
import { Module } from './Module';

export class Fun extends Module {
  public constructor() {
    super();
  }

  @command()
  public async cat() {
    console.log('in cat');
    console.log(Reflect.getMetadata('command:name', Fun.prototype, "cat"));
  }

  @command()
  public async dog() {
    console.log('in dog');
    console.log(Reflect.getMetadata('command:name', Fun.prototype, "dog"));
  }

  @subcommand(Fun.prototype.cat)
  public async dadjoke() {
    console.log('in dadjoke');
    console.log(Reflect.getMetadata('command:name', Fun.prototype, "dadjoke"));
  }
}
