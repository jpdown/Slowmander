import { BotConfig } from "./BotConfig";
import { PantherBot } from "../Bot";
import { GuildConfig } from "./GuildConfig";
import { ReactionRoleConfig } from "./ReactionRoleConfig";

export class ConfigManager {
    private _botConfig: BotConfig;
    private _guildConfig: GuildConfig;
    private _reactionRoleConfig: ReactionRoleConfig
    private _bot: PantherBot;

    constructor(bot: PantherBot) {
        this._bot = bot;
        this._botConfig = new BotConfig(bot);
        this._guildConfig = new GuildConfig(bot);
        this._reactionRoleConfig = new ReactionRoleConfig(bot);
    }

    public get botConfig() {
        return(this._botConfig);
    }

    public get guildConfig() {
        return(this._guildConfig);
    }

    public get reactionRoleConfig() {
        return(this._reactionRoleConfig);
    }
}