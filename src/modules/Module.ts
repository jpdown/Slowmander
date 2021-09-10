import { Command } from 'commands/Command';

import 'reflect-metadata';

export abstract class Module {
  public readonly commands: Command[];

  constructor() {
    this.commands = [];
    this.addCommands();
  }

  private addCommands() {
    const proto = Reflect.getPrototypeOf(this);
    if (proto) {
      Reflect.ownKeys(proto).forEach((key) => {
        if (Reflect.hasMetadata('command:type', this, key)) {
          this.commands.push(new Command(Reflect.getMetadata('command:name', this, key), Reflect.get(this, key)));
        }
      });
    }
    else {
      throw new Error('Something went wrong enumerating commands.');
    }
  }
}
