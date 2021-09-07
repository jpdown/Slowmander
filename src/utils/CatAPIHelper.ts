import type Bot from 'Bot';
import { Logger } from 'Logger';

import type { User } from 'discord.js';
import querystring from 'querystring';

export class CatAPIHelper {
  public static async getImage(user: User, bot: Bot, api: string, token: string): Promise<string | undefined> {
    let imageUrl: string | undefined;

    const headers = {
      'X-API-KEY': token,
    };
    const params = {
      limit: 1,
    };

    try {
      const newUrl: string = `${api}?${querystring.stringify(params)}`;
      const respJson: CatAPIResp[] = await (await fetch(newUrl, { method: 'get', headers })).json() as CatAPIResp[];
      imageUrl = respJson[0].url;
    } catch (err) {
      await new Logger(bot, CatAPIHelper.name).error(`Error obtaining image from API ${api}`, err);
    }

    return imageUrl;
  }
}

export type CatAPIResp = {
  id: string;
  url: string;
};

export type DogAPIResp = {
  message: string;
  status: string;
};
