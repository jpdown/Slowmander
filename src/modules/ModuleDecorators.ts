import { CommandArgument, PermissionLevel } from 'commands/Command';
import type { Snowflake } from 'discord-api-types';

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

export function guild(guildId: Snowflake) {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:guild', guildId, target, propertyKey);
  };
}

export function guildOnly() {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:guildOnly', true, target, propertyKey);
  };
}

export function isOwner() {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:permLevel', PermissionLevel.Owner, target, propertyKey);
  };
}

export function isAdmin() {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:permLevel', PermissionLevel.Admin, target, propertyKey);
  };
}

export function isMod() {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:permLevel', PermissionLevel.Mod, target, propertyKey);
  };
}

export function isVIP() {
  return (target: Object, propertyKey: string) => {
    Reflect.defineMetadata('command:permLevel', PermissionLevel.VIP, target, propertyKey);
  };
}
