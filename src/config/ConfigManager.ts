import { BotConfig } from "./BotConfig";
import { PantherBot } from "../Bot";
import { Config } from "./Credentials";

export class ConfigManager {
    private _botConfig: BotConfig;
    private _bot: PantherBot;

    constructor(bot: PantherBot) {
        this._bot = bot;
        this._botConfig = new BotConfig(bot);
    }

    public get botConfig() {
        return(this._botConfig);
    }
}