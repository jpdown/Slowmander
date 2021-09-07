/* eslint-disable max-classes-per-file */
import { Command, PermissionLevel, CommandResult } from 'commands/Command';
import type Bot from 'Bot';
import CommandUtils from 'utils/CommandUtils';
import { CatAPIHelper, DogAPIResp } from 'utils/CatAPIHelper';

import { Message, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';

export class Cat extends Command {
  private readonly API: string = 'https://api.thecatapi.com/v1/images/search';

  private apiToken?: string;

  constructor(bot: Bot) {
    super('cat', PermissionLevel.Everyone, 'Gives a random cat image', bot, { aliases: ['kitty', 'meow'] });
  }

  async run(bot: Bot, message: Message): Promise<CommandResult> {
    if (!this.apiToken) {
      if (bot.catApiToken === '') {
        await CommandUtils.sendMessage("I don't have an API token.", message.channel, bot);
        return { sendHelp: false, command: this, message };
      }
      this.apiToken = bot.catApiToken;
    }

    const sentMessage: Message = await CommandUtils.sendMessage('Looking for a cat...', message.channel, bot, message);
    const catUrl: string | undefined = await CatAPIHelper.getImage(
      message.author, bot, this.API, this.apiToken,
    );
    let embed: MessageEmbed;

    if (catUrl !== undefined && catUrl !== '') {
      // Build embed
      embed = new MessageEmbed()
        .setColor(await CommandUtils.getSelfColor(message.channel, bot))
        .setTitle('🐱 Found a cat!')
        .setURL(catUrl)
        .setImage(catUrl);
    } else {
      embed = new MessageEmbed()
        .setColor(await CommandUtils.getSelfColor(message.channel, bot))
        .setDescription("I couldn't find a cat... :(");
    }

    await sentMessage.edit({ embeds: [embed] });

    return { sendHelp: false, command: this, message };
  }
}

export class Dog extends Command {
  private readonly API: string = 'https://dog.ceo/api/breeds/image/random';

  constructor(bot: Bot) {
    super('dog', PermissionLevel.Everyone, 'Gives a random dog image', bot, { aliases: ['woof', 'bark'] });
  }

  async run(bot: Bot, message: Message): Promise<CommandResult> {
    const sentMessage: Message = await CommandUtils.sendMessage('Looking for a dog...', message.channel, bot, message);
    let dogJson: DogAPIResp;
    let dogImage: string | undefined;
    let embed: MessageEmbed;

    try {
      const headers = {
        'User-Agent': 'Slowmander',
      };

      dogJson = await (await fetch(this.API, { method: 'get', headers })).json() as DogAPIResp;
      dogImage = dogJson.message;
    } catch (err) {
      await this.logger.error('Error getting dog image from API', err);
    }

    if (dogImage !== undefined && dogImage !== '') {
      // Build embed
      embed = new MessageEmbed()
        .setColor(await CommandUtils.getSelfColor(message.channel, bot))
        .setTitle('🐶 Found a dog!')
        .setURL(dogImage)
        .setImage(dogImage);
    } else {
      embed = new MessageEmbed()
        .setColor(await CommandUtils.getSelfColor(message.channel, bot))
        .setDescription("I couldn't find a dog... :(");
    }

    await sentMessage.edit({ embeds: [embed] });

    return { sendHelp: false, command: this, message };
  }
}

export class DadJoke extends Command {
  private readonly API: string = 'https://icanhazdadjoke.com/';

  constructor(bot: Bot) {
    super('dadjoke', PermissionLevel.Everyone, 'Gives a random dad joke', bot, { aliases: ['dad'] });
  }

  async run(bot: Bot, message: Message): Promise<CommandResult> {
    const sentMessage: Message = await CommandUtils.sendMessage('Looking for a dad joke...', message.channel, bot, message);
    let dadJokeMessage = '';
    let embed: MessageEmbed;

    try {
      const headers = {
        Accept: 'text/plain',
        'User-Agent': 'Slowmander',
      };

      dadJokeMessage = await (await fetch(this.API, { method: 'get', headers })).text();
    } catch (err) {
      await this.logger.error('Error getting dad joke from API', err);
    }

    if (dadJokeMessage !== undefined && dadJokeMessage !== '') {
      // Build embed
      embed = new MessageEmbed()
        .setColor(await CommandUtils.getSelfColor(message.channel, bot))
        .setDescription(dadJokeMessage);
    } else {
      embed = new MessageEmbed()
        .setColor(await CommandUtils.getSelfColor(message.channel, bot))
        .setDescription("I couldn't find a dad joke... :(");
    }

    await sentMessage.edit({ embeds: [embed] });

    return { sendHelp: false, command: this, message };
  }
}
