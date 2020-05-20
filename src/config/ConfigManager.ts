import { BotConfig } from "./BotConfig";
import { PantherBot } from "../Bot";
import { Credentials } from "./Credentials";
import { GuildConfig } from "./GuildConfig";

export class ConfigManager {
    private _botConfig: BotConfig;
    private _guildConfig: GuildConfig;
    private _bot: PantherBot;

    constructor(bot: PantherBot) {
        this._bot = bot;
        this._botConfig = new BotConfig(bot);
        this._guildConfig = new GuildConfig(bot);
    }

    public get botConfig() {
        return(this._botConfig);
    }

    public get guildConfig() {
        return(this._guildConfig);
    }
}