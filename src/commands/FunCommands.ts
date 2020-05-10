import {Command, PermissionLevel, CommandResult} from './Command';
import { PantherBot } from '../Bot';

import {Message, User, MessageEmbed } from 'discord.js';
import fetch from "node-fetch";
import querystring from "querystring";
import { CommandUtils } from '../utils/CommandUtils';
import { LogLevel } from '../Logger';

export class Cat extends Command {
    private readonly API: string = "https://api.thecatapi.com/v1/images/search";
    private readonly API_TOKEN: string = "dfc67c5a-ee60-4621-8200-93a1a3336de9";

    constructor() {
        super("cat", PermissionLevel.Everyone, "Gives a random cat image", "", true);
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let sentMessage: Message = await this.sendMessage("Looking for a cat...", message.channel, bot);
        let catUrl: string = await CatAPIHelper.getImage(message.author, bot, this.API, this.API_TOKEN);
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
        
        await sentMessage.edit(embed);

        return {sendHelp: false, command: this, message: message};
    }
}

export class Dog extends Command {
    private readonly API: string = "https://dog.ceo/api/breeds/image/random";

    constructor() {
        super("dog", PermissionLevel.Everyone, "Gives a random dog image", "", true);
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let sentMessage: Message = await this.sendMessage("Looking for a dog...", message.channel, bot);
        let dogJson: DogAPIResp;
        let dogImage: string;
        let embed: MessageEmbed;

        try {
            let headers = {
                "User-Agent": "PantherBot-discord.js"
            }

            dogJson = await (await fetch(this.API, { method: "get", headers: headers })).json();
            dogImage = dogJson.message;
        }
        catch(err) {
            bot.logger.log(LogLevel.ERROR, "Dog:run Error getting dog image from API", err);
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
        
        await sentMessage.edit(embed);

        return {sendHelp: false, command: this, message: message};
    }
}

export class DadJoke extends Command {
    private readonly API: string = "https://icanhazdadjoke.com/";

    constructor() {
        super("dadjoke", PermissionLevel.Everyone, "Gives a random dad joke", "", true);
    }

    async run(bot: PantherBot, message: Message, args: string[]): Promise<CommandResult> {
        let sentMessage: Message = await this.sendMessage("Looking for a dad joke...", message.channel, bot);
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
            bot.logger.log(LogLevel.ERROR, "DadJoke:run Error getting dad joke from API", err);
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
        
        await sentMessage.edit(embed);

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
            console.log(newUrl);
            let respJson: CatAPIResp[] = await (await fetch(newUrl, { method: "get", headers: headers })).json();
            imageUrl = respJson[0].url;
        }
        catch(err) {
            bot.logger.log(LogLevel.ERROR, "CatDogAPIHelper:getImage Error obtaining image from API " + api, err);
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