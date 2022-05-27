import { Credentials } from "config/Credentials";
import { CommandManager } from "CommandManager";
import { ReactionRoleManager } from "reactionroles/ReactionRoleManager";
import { Logger, LogLevel } from "Logger";
import { EventLogger } from "eventlogs/EventLogger";
import { DatabaseManager } from "database/DatabaseManager";
import { VerificationManager } from "verification/VerificationManager";
import { Client, Snowflake } from "discord.js";
import { Config } from "config/Config";
import { CommandUtils } from "utils/CommandUtils";
import { TwitchAPIManager } from "./twitch/TwitchAPIManager";
import { TwitchClipModManager } from "./twitch/TwitchClipModManager";
import { SpamChecker } from "SpamChecker";

export class Bot {
    private readonly credentials: Credentials;

    private readonly verificationManager: VerificationManager;

    private readonly twitchClipModManager: TwitchClipModManager;

    private readonly logger: Logger;

    private readonly eventLogger: EventLogger;

    private readonly spamChecker: SpamChecker;

    private readonly reactionRoleManager: ReactionRoleManager;

    public readonly client: Client<true>;

    public readonly config: Config;

    public readonly db: DatabaseManager;

    public readonly commandManager: CommandManager;

    public readonly twitch: TwitchAPIManager;

    public readonly dataPath: string;

    public dev: boolean = false;

    constructor() {
        this.client = new Client({
            intents: [
                "GUILDS",
                "GUILD_MEMBERS",
                "GUILD_BANS",
                "GUILD_EMOJIS_AND_STICKERS",
                "GUILD_MESSAGES",
                "GUILD_MESSAGE_REACTIONS",
                "DIRECT_MESSAGES",
                "DIRECT_MESSAGE_REACTIONS",
            ],
            partials: ["MESSAGE", "REACTION", "CHANNEL"],
        });
        this.dataPath = process.env.SLOWMANDER_DATA_PATH || "./data";
        Logger.bot = this;
        this.logger = Logger.getLogger(this);
        this.credentials = new Credentials(this);
        this.config = new Config(this);
        this.db = new DatabaseManager(this);
        this.commandManager = new CommandManager(this);
        this.eventLogger = new EventLogger(this);
        this.spamChecker = new SpamChecker(this);
        this.verificationManager = new VerificationManager(this);
        this.twitch = new TwitchAPIManager(
            this,
            this.credentials.twitchId,
            this.credentials.twitchSecret
        );
        this.twitchClipModManager = new TwitchClipModManager(this);
        this.reactionRoleManager = new ReactionRoleManager(this);
        CommandUtils.bot = this;

        this.client.on("ready", async () => {
            await this.logger.info(
                `Welcome to Slowmander! Logged in as ${this.client.user.tag} in ${this.client.guilds.cache.size} guild(s).`
            );
            await this.commandManager.deploySlashCommands();

            this.dev = this.credentials.devIds.filter(id => {return this.client.user.id === id;}).length > 0;
            if (this.dev) {
                this.logger.info("Running in IDE, debug features enabled")
            }
        });
    }

    public run() {
        const { token } = this.credentials;
        if (token === "") {
            this.logger.logSync(
                LogLevel.ERROR,
                "No token provided, please put a valid token in the config file."
            );
            process.exit();
        }

        this.client.login(token).then(() => {
            this.client.on(
                "messageCreate",
                this.commandManager.parseCommand.bind(this.commandManager)
            );
            this.client.on(
                "interactionCreate",
                this.commandManager.handleSlash.bind(this.commandManager)
            );
            this.client.on(
                "interactionCreate",
                this.commandManager.handleAutocomplete.bind(this.commandManager)
            );
            this.client.on(
                "messageReactionAdd",
                this.reactionRoleManager.onMessageReactionAdd.bind(
                    this.reactionRoleManager
                )
            );
            this.client.on(
                "messageReactionRemove",
                this.reactionRoleManager.onMessageReactionRemove.bind(
                    this.reactionRoleManager
                )
            );
            this.client.on(
                "guildMemberAdd",
                this.verificationManager.onGuildMemberAdd.bind(
                    this.verificationManager
                )
            );
            this.client.on(
                "messageReactionAdd",
                this.verificationManager.onMessageReactionAdd.bind(
                    this.verificationManager
                )
            );
            this.client.on(
                "messageCreate",
                this.twitchClipModManager.onMessage.bind(
                    this.twitchClipModManager
                ),
            );
            this.client.on(
                "messageCreate",
                this.spamChecker.checkMessage.bind(
                    this.spamChecker
                )
            )
            this.client.on(
                "messageUpdate",
                this.twitchClipModManager.onMessageUpdate.bind(
                    this.twitchClipModManager
                )
            );
        });
    }

    public async addOwner(ownerId: Snowflake) {
        return this.credentials.addOwner(ownerId);
    }

    public async removeOwner(ownerId: Snowflake) {
        return this.credentials.removeOwner(ownerId);
    }

    public get owners(): Snowflake[] {
        return this.credentials.owners;
    }

    public get catApiToken(): string {
        return this.credentials.catApiToken;
    }
}

const bot = new Bot();

bot.run();
