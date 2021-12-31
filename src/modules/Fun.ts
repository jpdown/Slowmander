import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import type { Command } from "commands/Command";
import { Channel, MessageEmbed, User } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import {
    args,
    command,
    group,
    guild,
    guildOnly,
    isAdmin,
    isMod,
    isOwner,
    isVIP,
    subcommand,
    subgroup,
} from "./ModuleDecorators";
import fetch from 'node-fetch';

export class Fun extends Module {
    public constructor(bot: Bot) {
        super(bot);
    }

    @command("Get a random cat image")
    public async cat(c: CommandContext) {
        if (this.bot.catApiToken === "") {
            throw new Error("Cat API token missing.");
        }

        await c.defer();

        // Get from TheCatAPI
        let catApiResp = await (await fetch("https://api.thecatapi.com/v1/images/search?limit=1", { method: "get", headers: { "X-API-KEY": this.bot.catApiToken } })).json();
        if (!(catApiResp instanceof Array) || catApiResp.length < 1 || !catApiResp[0].url || catApiResp[0].url === "") {
            throw new Error(`Error obtaining image from TheCatAPI`);
        }

        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .setTitle("🐱 Meow!")
            .setURL(catApiResp[0].url)
            .setImage(catApiResp[0].url);
        
        await c.reply({embeds: [embed]});
    }

    @command("Get a random dog image")
    public async dog(c: CommandContext) {
        await c.defer();

        // Get from TheCatAPI
        let dogApiResp = await (await fetch("https://dog.ceo/api/breeds/image/random", { method: "get", headers: { "User-Agent": "Slowmander" } })).json();
        if (!dogApiResp.message || dogApiResp.message === "") {
            throw new Error(`Error obtaining image from dog.ceo`);
        }

        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .setTitle("🐶 Woof!")
            .setURL(dogApiResp.message)
            .setImage(dogApiResp.message);
        
        await c.reply({embeds: [embed]});
    }

    @command("Get a random dad joke")
    public async dadjoke(c: CommandContext) {
        await c.defer();

        // Get from TheCatAPI
        let dadjokeMsg = await (await fetch("https://icanhazdadjoke.com/", { method: "get", headers: { "User-Agent": "Slowmander", Accept: 'text/plain' } })).text();
        if (!dadjokeMsg || dadjokeMsg === "") {
            throw new Error(`Error obtaining dadjoke`);
        }
        
        await c.reply(dadjokeMsg);
    }
}
