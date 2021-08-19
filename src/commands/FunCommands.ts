import {Command, PermissionLevel, CommandResult} from 'commands/Command';
import { PantherBot } from 'Bot';
import { CommandUtils } from 'utils/CommandUtils';
import { Logger } from 'Logger';

import {Message, User, MessageEmbed } from 'discord.js';
import fetch from "node-fetch";
import querystring from "querystring";

export class Cat extends Command {
    private readonly API: string = "https://api.thecatapi.com/v1/images/search";
    private apiToken: string;

    constructor(bot: PantherBot) {
        super("cat", PermissionLevel.Everyone, "Gives a random cat image", bot, {aliases: ["kitty", "meow"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        if(!this.apiToken) {
            if(bot.catApiToken === "") {
                CommandUtils.sendMessage("I don't have an API token.", message.channel, bot);
                return;
            }
            this.apiToken = bot.catApiToken;
        }

        let sentMessage: Message = await CommandUtils.sendMessage("Looking for a cat...", message.channel, bot, message);
        let catUrl: string = await CatAPIHelper.getImage(message.author, bot, this.API, this.apiToken);
        let embed: MessageEmbed;

        if(catUrl !== undefined && catUrl !== "") {
            //Build embed
            embed = new MessageEmbed()
                .setColor(await CommandUtils.getSelfColor(message.channel, bot))
                .setTitle(`🐱 Found a cat!`)
                .setURL(catUrl)
                .setImage(catUrl);
        }
        else {
            embed = new MessageEmbed()
                .setColor(await CommandUtils.getSelfColor(message.channel, bot))
                .setDescription("I couldn't find a cat... :(");
        }
        
        await sentMessage.edit({ embeds: [embed] });

        return {sendHelp: false, command: this, message: message};
    }
}

export class Dog extends Command {
    private readonly API: string = "https://dog.ceo/api/breeds/image/random";

    constructor(bot: PantherBot) {
        super("dog", PermissionLevel.Everyone, "Gives a random dog image", bot, {aliases: ["woof", "bark"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let sentMessage: Message = await CommandUtils.sendMessage("Looking for a dog...", message.channel, bot, message);
        let dogJson: DogAPIResp;
        let dogImage: string;
        let embed: MessageEmbed;

        try {
            let headers = {
                "User-Agent": "Slowmander"
            }

            dogJson = await (await fetch(this.API, { method: "get", headers: headers })).json();
            dogImage = dogJson.message;
        }
        catch(err) {
            await this.logger.error("Error getting dog image from API", err);
        }

        if(dogImage !== undefined && dogImage !== "") {
            //Build embed
            embed = new MessageEmbed()
                .setColor(await CommandUtils.getSelfColor(message.channel, bot))
                .setTitle("🐶 Found a dog!")
                .setURL(dogImage)
                .setImage(dogImage);
        }
        else {
            embed = new MessageEmbed()
                .setColor(await CommandUtils.getSelfColor(message.channel, bot))
                .setDescription("I couldn't find a dog... :(");
        }
        
        await sentMessage.edit({ embeds: [embed] });

        return {sendHelp: false, command: this, message: message};
    }
}

export class DadJoke extends Command {
    private readonly API: string = "https://icanhazdadjoke.com/";

    constructor(bot: PantherBot) {
        super("dadjoke", PermissionLevel.Everyone, "Gives a random dad joke", bot, {aliases: ["dad"]});
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let sentMessage: Message = await CommandUtils.sendMessage("Looking for a dad joke...", message.channel, bot, message);
        let dadJokeMessage: string = "";
        let embed: MessageEmbed;

        try {
            let headers = {
                "Accept": "text/plain",
                "User-Agent": "PantherBot-discord.js"
            }

            dadJokeMessage = await (await fetch(this.API, { method: "get", headers: headers })).text();
        }
        catch(err) {
            await this.logger.error("Error getting dad joke from API", err);
        }

        if(dadJokeMessage !== undefined && dadJokeMessage !== "") {
            //Build embed
            embed = new MessageEmbed()
                .setColor(await CommandUtils.getSelfColor(message.channel, bot))
                .setDescription(dadJokeMessage);
        }
        else {
            embed = new MessageEmbed()
                .setColor(await CommandUtils.getSelfColor(message.channel, bot))
                .setDescription("I couldn't find a dad joke... :(");
        }
        
        await sentMessage.edit({ embeds: [embed] });

        return {sendHelp: false, command: this, message: message};
    }
}

class CatAPIHelper {
    public static async getImage(user: User, bot: PantherBot, api: string, token: string): Promise<string> {
        let imageUrl: string = undefined;

        let headers = {
            "X-API-KEY": token
        };
        let params = {
            "limit": 1,
        }

        try {
            let newUrl: string = api + "?" + querystring.stringify(params);
            let respJson: CatAPIResp[] = await (await fetch(newUrl, { method: "get", headers: headers })).json();
            imageUrl = respJson[0].url;
        }
        catch(err) {
            await new Logger(bot, CatAPIHelper.name).error("Error obtaining image from API " + api, err);
        }

        return(imageUrl);
    }
}

interface CatAPIResp {
    breeds: Object[],
    height: number,
    id: string,
    url: string,
    width: number
}

interface DogAPIResp {
    message: string,
    status: string
}