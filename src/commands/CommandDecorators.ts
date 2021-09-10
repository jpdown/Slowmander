import type { CommandContext } from "CommandContext";

export function command(name?: string) {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'command', target, propertyKey);
  };
}

export function subcommand(parent: (ctx: CommandContext, ...args: any[]) => Promise<void>, name?: string) {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'command', target, propertyKey);
    Reflect.defineMetadata('command:parent', parent.name, target, propertyKey);
  };
}

export function group(name?: string) {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'group', target, propertyKey);
  };
}

export function subgroup(parent: (ctx: CommandContext, ...args: any[]) => Promise<void>, name?: string) {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'group', target, propertyKey);
    Reflect.defineMetadata('command:parent', parent.name, target, propertyKey);
  };
}
