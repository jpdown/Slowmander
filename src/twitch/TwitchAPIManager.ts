import type { Bot } from "Bot";
import { Logger } from "Logger";

import { ApiClient, HelixClip, HelixUser } from "@twurple/api";
import { ClientCredentialsAuthProvider } from "@twurple/auth";

export class TwitchAPIManager {
    private bot: Bot;

    private logger: Logger;

    private client: ApiClient | undefined;

    private clientId: string;

    private clientSecret: string;

    constructor(bot: Bot, clientId: string, clientSecret: string) {
        this.bot = bot;
        this.logger = Logger.getLogger(this);
        this.client = undefined;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public async getUserId(username: string): Promise<string | null> {
        if (this.client === undefined) {
            await this.getClient();
        }

        if (this.client === undefined) {
            // Give up, we don't have auth
            await this.logger.warning("No Twitch auth, failing.");
            return null;
        }

        // Get user
        const twitchUser: HelixUser | null =
            await this.client.users.getUserByName(username);

        if (twitchUser === null) {
            return null;
        }

        return twitchUser.id;
    }

    public async getUserIds(users: string[]): Promise<HelixUser[] | null> {
        if (this.client === undefined) {
            await this.getClient();
        }

        if (this.client === undefined) {
            // Give up, we don't have auth
            await this.logger.warning("No Twitch auth, failing.");
            return null;
        }

        const twitchUsers: HelixUser[] =
            await this.client.users.getUsersByNames(users);
        return twitchUsers;
    }

    public async getUsersByIds(userIds: string[]): Promise<HelixUser[] | null> {
        if (this.client === undefined) {
            await this.getClient();
        }

        if (this.client === undefined) {
            // Give up, we don't have auth
            await this.logger.warning("No Twitch auth, failing.");
            return null;
        }

        const twitchUsers: HelixUser[] = await this.client.users.getUsersByIds(
            userIds
        );
        return twitchUsers;
    }

    public async getClipBroadcasterId(clipId: string): Promise<string | null> {
        if (this.client === undefined) {
            await this.getClient();
        }

        if (this.client === undefined) {
            // Give up, we don't have auth
            await this.logger.warning("No Twitch auth, failing.");
            return null;
        }

        // Get clip
        const twitchClip: HelixClip | null =
            await this.client.clips.getClipById(clipId);

        if (twitchClip === null) {
            return null;
        }

        return twitchClip.broadcasterId;
    }

    public async getApiStatus(): Promise<boolean> {
        await this.getClient();

        return this.client !== undefined;
    }

    private async getClient(): Promise<void> {
        if (
            this.client !== undefined ||
            this.clientId === "" ||
            this.clientSecret === ""
        ) {
            return;
        }

        const auth = new ClientCredentialsAuthProvider(
            this.clientId,
            this.clientSecret
        );
        this.client = new ApiClient({ authProvider: auth });
    }
}
