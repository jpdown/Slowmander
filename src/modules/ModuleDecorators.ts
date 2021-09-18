import type { CommandArgument } from 'commands/Command';

export function command(name?: string) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'command', target, propertyKey);
  };
}

export function subcommand(parent: string, name?: string) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'command', target, propertyKey);
    Reflect.defineMetadata('command:parent', parent, target, propertyKey);
  };
}

export function group(name?: string) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'group', target, propertyKey);
  };
}

export function subgroup(parent: string, name?: string) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:name', name ?? propertyKey, target, propertyKey);
    Reflect.defineMetadata('command:type', 'group', target, propertyKey);
    Reflect.defineMetadata('command:parent', parent, target, propertyKey);
  };
}

export function args(types: CommandArgument[]) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:args', types, target, propertyKey);
  };
}
