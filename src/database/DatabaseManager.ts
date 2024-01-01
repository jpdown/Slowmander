import BS3 from "better-sqlite3";

import type { Bot } from "Bot";
import { Logger } from "Logger";
import { EventLogs } from "./EventLogs";
import { GuildConfigs } from "./GuildConfigs";
import { LockdownPresets } from "./LockdownPresets";
import { ReactionRoles } from "./ReactionRoles";
import { TwitchClipModeration } from "./TwitchClipModeration";
import { Verification } from "./Verification";

export class DatabaseManager {
    private readonly DB_FILE: string = "slowmander.db";

    private DB_PATH: string;

    private readonly DB_VERSION: number = 2;

    private readonly logger: Logger;

    private readonly db: BS3.Database;

    public readonly eventLogs: EventLogs;

    public readonly guildConfigs: GuildConfigs;

    public readonly lockdownPresets: LockdownPresets;

    public readonly reactionRoles: ReactionRoles;

    public readonly twitchClipMod: TwitchClipModeration;

    public readonly verification: Verification;

    constructor(bot: Bot) {
        this.logger = Logger.getLogger(this);
        this.DB_PATH = bot.dataPath + "/" + this.DB_FILE;
        this.db = new BS3(this.DB_PATH);

        this.db.pragma("foreign_keys = ON");
        this.checkSchema();

        this.eventLogs = new EventLogs(bot, this.db);
        this.guildConfigs = new GuildConfigs(bot, this.db);
        this.lockdownPresets = new LockdownPresets(bot, this.db);
        this.reactionRoles = new ReactionRoles(bot, this.db);
        this.twitchClipMod = new TwitchClipModeration(bot, this.db);
        this.verification = new Verification(bot, this.db);
    }

    private checkSchema() {
        const dbVersion: number = this.db.pragma("user_version;", {
            simple: true,
        }) as number;

        // TODO: this sucks
        if (dbVersion < 1) {
            this.createSchemaVer1();
        }
        if (dbVersion < 2) {
            this.createSchemaVer2();
        }
        if (dbVersion < 3) {
            this.createSchemaVer3();
        }
    }

    private createSchemaVer1() {
        try {
            this.db.prepare("BEGIN;").run();

            this.db
                .prepare(
                    "CREATE TABLE EventLogs(" +
                        '"guildId" TEXT NOT NULL PRIMARY KEY,' +
                        '"channelId" TEXT' +
                        ");"
                )
                .run();

            this.db
                .prepare(
                    "CREATE TABLE GuildConfigs(" +
                        '"guildId" TEXT NOT NULL PRIMARY KEY,' +
                        '"prefix" TEXT,' +
                        '"vipRole" TEXT,' +
                        '"modRole" TEXT,' +
                        '"adminRole" TEXT,' +
                        '"modChannel" TEXT' +
                        ");"
                )
                .run();

            this.db
                .prepare(
                    "CREATE TABLE LockdownPresets(" +
                        '"guildId" TEXT NOT NULL,' +
                        '"preset" TEXT NOT NULL,' +
                        '"grant" BOOLEAN NOT NULL CHECK (grant IN (0, 1)),' +
                        "PRIMARY KEY(guildId, preset)" +
                        ");"
                )
                .run();

            this.db
                .prepare(
                    "CREATE TABLE LockdownChannels(" +
                        '"guildId" TEXT NOT NULL,' +
                        '"preset" TEXT NOT NULL,' +
                        '"channelId" TEXT NOT NULL,' +
                        "FOREIGN KEY(guildId, preset) REFERENCES LockdownPresets(guildId, preset)," +
                        "PRIMARY KEY(guildId, preset, channelId)" +
                        ");"
                )
                .run();

            this.db
                .prepare(
                    "CREATE TABLE LockdownRoles(" +
                        '"guildId" TEXT NOT NULL,' +
                        '"preset" TEXT NOT NULL,' +
                        '"roleId" TEXT NOT NULL,' +
                        "FOREIGN KEY(guildId, preset) REFERENCES LockdownPresets(guildId, preset)," +
                        "PRIMARY KEY(guildId, preset, roleId)" +
                        ");"
                )
                .run();

            this.db
                .prepare(
                    "CREATE TABLE ReactionRoles(" +
                        '"channelId" TEXT NOT NULL,' +
                        '"messageId" TEXT NOT NULL,' +
                        '"emoteId" TEXT NOT NULL,' +
                        '"roleId" TEXT NOT NULL,' +
                        '"guildId" TEXT NOT NULL,' +
                        "PRIMARY KEY(channelId, messageId, emoteId)" +
                        ");"
                )
                .run();

            this.db
                .prepare(
                    "CREATE TABLE TwitchClipModConfigs(" +
                        '"channelId" TEXT NOT NULL PRIMARY KEY,' +
                        '"enabled" BOOLEAN NOT NULL DEFAULT 0 CHECK (enabled in (0, 1)),' +
                        '"approvedOnly" BOOLEAN NOT NULL DEFAULT 0 CHECK (enabled in (0, 1))' +
                        ");"
                )
                .run();

            this.db
                .prepare(
                    "CREATE TABLE TwitchClipApprovedChannels(" +
                        '"channelId" TEXT NOT NULL,' +
                        '"twitchChannel" TEXT NOT NULL,' +
                        "FOREIGN KEY(channelId) REFERENCES TwitchClipModConfigs(channelId)," +
                        "PRIMARY KEY(channelId, twitchChannel)" +
                        ");"
                )
                .run();

            this.db
                .prepare(
                    "CREATE TABLE VerificationConfigs(" +
                        '"guildId" TEXT NOT NULL PRIMARY KEY,' +
                        '"enabled" BOOLEAN NOT NULL DEFAULT 0 CHECK (enabled in (0, 1)),' +
                        '"channelId" TEXT NOT NULL,' +
                        '"messageId" TEXT NOT NULL,' +
                        '"emoteId" TEXT NOT NULL,' +
                        '"roleId" TEXT NOT NULL,' +
                        '"removeReaction" BOOLEAN NOT NULL DEFAULT 0 CHECK (removeReaction in (0, 1))' +
                        ");"
                )
                .run();

            this.db.pragma("user_version = 1;");

            this.db.prepare("COMMIT;").run();
            this.logger.info("Database schema version 1 created.");
        } catch (err) {
            this.db.prepare("ROLLBACK;").run();
            this.logger.error("Error creating schema version 1.", err);
        }
    }

    private createSchemaVer2() {
        try {
            this.db.prepare("BEGIN;").run();

            this.db.prepare('ALTER TABLE GuildConfigs ADD COLUMN "spamBan" BOOLEAN DEFAULT 0 NOT NULL;').run();

            this.db.pragma("user_version = 2;");

            this.db.prepare("COMMIT;").run();
            this.logger.info("Database schema version 2 created.");
        } catch (err) {
            this.db.prepare("ROLLBACK;").run();
            this.logger.error("Error creating schema version 2.", err);
        }
    }

    private createSchemaVer3() {
        try {
            this.db.prepare("BEGIN;").run();

            this.db
                .prepare(
                    "CREATE TABLE StarboardConfigs(" +
                        '"guildId" TEXT NOT NULL PRIMARY KEY,' +
                        '"enabled" BOOLEAN NOT NULL DEFAULT 0 CHECK (enabled in (0, 1)),' +
                        '"channelId" TEXT NOT NULL,' +
                        '"emoteId" TEXT NOT NULL,' +
                        '"numReacts" INT NOT NULL,' +
                        ");"
                )
                .run();

            this.db.pragma("user_version = 3;");

            this.db.prepare("COMMIT;").run();
            this.logger.info("Database schema version 3 created.");
        } catch (err) {
            this.db.prepare("ROLLBACK;").run();
            this.logger.error("Error creating schema version 3.", err);
        }
    }
}
