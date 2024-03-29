import type { Bot } from "Bot";
import type { CommandContext } from "CommandContext";
import { MessageEmbed } from "discord.js";
import { CommandUtils } from "utils/CommandUtils";
import { Module } from "./Module";
import { args, command } from "./ModuleDecorators";
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

    @command("Get a random cat girl")
    public async catgirl(c: CommandContext) {
        await c.defer();

        // Get from nekos.life
        let resp = await (await fetch("https://nekos.life/api/v2/img/neko")).json();
        if (!resp.url) {
            throw new Error(`Error obtaining image from nekos.life`);
        }

        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .setTitle("Awoo!")
            .setURL(resp.url)
            .setImage(resp.url);
        
        await c.reply({embeds: [embed]});
    }

    @command("Get a random Miku")
    public async miku(c: CommandContext) {
        await c.defer();

        // Get from hatsune-miku.online
        let resp = await (await fetch("https://hatsune-miku.online/api/v2/image/random")).json();
        if (!resp.webPLink) {
            throw new Error(`Error obtaining image from hatsune-miku.online`);
        }

        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .setTitle(resp.title ?? "Miku :D")
            .setURL(resp.sourceLink)
            .setImage(resp.webPLink)
            .setAuthor({ name: resp.artist, url: resp.sourceLink })
            .setFooter("Source: " + resp.sourceLink);

        if (resp.description !== "None") {
            embed.setDescription(resp.description);
        }
        
        await c.reply({embeds: [embed]});
    }

    @command("?")
    public async why(c: CommandContext) {
        await c.defer();

        let resp = await (await fetch("https://nekos.life/api/v2/why")).json();
        if (!resp.why) {
            throw new Error(`Error obtaining text from nekos.life`);
        }

        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .setTitle("?")
            .setDescription(resp.why);

        await c.reply({embeds: [embed]});
    }

    @command("Roll them dice. Includes 0 as a possible value.")
    @args([{ name: "max", type: "int", description: "The max number to roll, inclusive. Defaults to 6.", optional: true }])
    public async roll(c: CommandContext, max?: number) {
        // We'll be flooring, so add 1 to keep inclusive
        let new_max = max ? max + 1 : 7;
        let rng = Math.floor(Math.random() * new_max);
        
        await c.reply(`🎲 ${rng}`)
    }

    @command("owo")
    @args([
        {
            name: "input",
            type: "string",
            description: "the text to owoify",
        },
    ])
    public async owo(c: CommandContext, msg: string) {
        await c.defer();
        let resp = await (await fetch(`https://nekos.life/api/v2/owoify?text=${msg}`)).json();
        if (!resp.owo) {
            throw new Error(`Error obtaining text from nekos.life`);
        }

        let s = "" 
        if (!c.interaction) {
            s += c.user.username + "#" + c.user.discriminator + ": \n"
        }
        s += resp.owo

        let embed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(c.channel))
            .setTitle("uwu")
            .setDescription(s);

        await c.reply({embeds: [embed]});
    }
}
