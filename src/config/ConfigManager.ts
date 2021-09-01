import { Bot } from "Bot";
import { GuildConfig } from "config/GuildConfig";
import { ReactionRoleConfig } from "config/ReactionRoleConfig";
import { LockdownConfig } from "config/LockdownConfig";
import { VerificationConfig } from "config/VerificationConfig";
import { TwitchClipModConfig } from "config/TwitchClipModConfig";

export class ConfigManager {
    private _guildConfig: GuildConfig;
    private _reactionRoleConfig: ReactionRoleConfig
    private _lockdownConfig: LockdownConfig;
    private _verificationConfig: VerificationConfig;
    private _twitchClipModConfig: TwitchClipModConfig;
    private _bot: Bot;

    constructor(bot: Bot) {
        this._bot = bot;
        this._guildConfig = new GuildConfig(bot);
        this._reactionRoleConfig = new ReactionRoleConfig(bot);
        this._lockdownConfig = new LockdownConfig(bot);
        this._verificationConfig = new VerificationConfig(bot);
        this._twitchClipModConfig = new TwitchClipModConfig(bot);
    }

    public get guildConfig() {
        return(this._guildConfig);
    }

    public get reactionRoleConfig() {
        return(this._reactionRoleConfig);
    }

    public get lockdownConfig() {
        return(this._lockdownConfig);
    }

    public get verificationConfig() {
        return(this._verificationConfig);
    }

    public get twitchClipModConfig() {
        return this._twitchClipModConfig;
    }
}
