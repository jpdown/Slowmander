import { CommandArgument } from "commands/Command";
import type { Snowflake } from "discord-api-types/v10";
import { Permissions, PermissionString } from "discord.js";

export function command(desc: string, name?: string) {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata(
            "command:name",
            name ?? propertyKey,
            target,
            propertyKey
        );
        Reflect.defineMetadata(
            "command:desc",
            desc ?? propertyKey,
            target,
            propertyKey
        );
        Reflect.defineMetadata("command:type", "command", target, propertyKey);
    };
}

export function noSlash() {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata("command:slash", false, target, propertyKey);
    };
}

export function subcommand(parent: string, desc: string, name?: string) {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata(
            "command:name",
            name ?? propertyKey,
            target,
            propertyKey
        );
        Reflect.defineMetadata(
            "command:desc",
            desc ?? propertyKey,
            target,
            propertyKey
        );
        Reflect.defineMetadata("command:type", "command", target, propertyKey);
        Reflect.defineMetadata("command:parent", parent, target, propertyKey);
    };
}

export function group(desc: string, name?: string) {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata(
            "command:name",
            name ?? propertyKey,
            target,
            propertyKey
        );
        Reflect.defineMetadata(
            "command:desc",
            desc ?? propertyKey,
            target,
            propertyKey
        );
        Reflect.defineMetadata("command:type", "group", target, propertyKey);
    };
}

export function subgroup(parent: string, desc: string, name?: string) {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata(
            "command:name",
            name ?? propertyKey,
            target,
            propertyKey
        );
        Reflect.defineMetadata(
            "command:desc",
            desc ?? propertyKey,
            target,
            propertyKey
        );
        Reflect.defineMetadata("command:type", "group", target, propertyKey);
        Reflect.defineMetadata("command:parent", parent, target, propertyKey);
    };
}

export function args(types: CommandArgument[]) {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata("command:args", types, target, propertyKey);
    };
}

export function guild(guildId: Snowflake) {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata("command:guild", guildId, target, propertyKey);
    };
}

export function guildOnly() {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata("command:guildOnly", true, target, propertyKey);
    };
}

export function isOwner() {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata(
            "command:ownerOnly",
            true,
            target,
            propertyKey
        );
    };
}

export function permissions(perms: PermissionString[]) {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata(
            "command:permissions",
            perms,
            target,
            propertyKey,
        );
    };
}

export function isMod() { return (target: Object, propertyKey: string) => {console.log('yep')} }
export function isAdmin() { return (target: Object, propertyKey: string) => {console.log('yep')} }