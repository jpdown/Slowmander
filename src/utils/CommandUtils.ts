import { ColorResolvable, TextChannel, DMChannel, NewsChannel, User, Client, Collection, Snowflake, Guild, GuildMember, Role, Channel, Emoji, WebhookClient } from "discord.js";

export class CommandUtils {
    static async getSelfColor(channel: TextChannel | DMChannel | NewsChannel): Promise<ColorResolvable> {
        const DEFAULT_COLOR = 0x00a4ff;

        if(channel.type === "text" || channel.type === "news") {
            return(channel.guild.me.displayColor);
        }
        else {
            return(DEFAULT_COLOR);
        }
    }

    static async splitCommandArgs(args: string, startPos?: number): Promise<string[]> {
        if(startPos === undefined)
            startPos = 0;
        return(args.slice(startPos).split(/ +/));
    }

    static async parseMember(potentialMember: string, guild: Guild): Promise<GuildMember> {
        let parsedMember: GuildMember = undefined;
        let parsedUser: User = await CommandUtils.parseUser(potentialMember, guild.client);

        if(parsedUser !== undefined) {
            parsedMember = guild.member(parsedUser);
        }

        return(parsedMember);
    }

    static async parseUser(potentialUser: string, client: Client): Promise<User> {
        let parsedUser: User = undefined;

        try {
            parsedUser = await client.users.fetch(await CommandUtils.parseUserID(potentialUser));
        }
        catch(err) {
            parsedUser = await CommandUtils.parseUserByName(potentialUser, client);
        }

        return(parsedUser);
    }

    static async parseUserByName(potentialUser: string, client: Client): Promise<User> {
        let parsedUser: User = undefined;
        let userCache: Collection<Snowflake, User> = client.users.cache;

        for(let user of userCache.values()) {
            if(user.username.toLowerCase() === potentialUser.toLowerCase() || `${user.username}#${user.discriminator}` === potentialUser) {
                parsedUser = user;
                break;
            }
        }

        return(parsedUser);
    }

    static async parseUserID(potentialUser: string): Promise<Snowflake> {
        let snowflake: string = potentialUser;

        if(snowflake.startsWith("<@") && snowflake.endsWith(">"))
            snowflake = snowflake.substring(2, snowflake.length - 1);
        if(snowflake.startsWith("!"))
            snowflake = snowflake.substring(1);

        return(snowflake);
    }

    static async parseRole(potentialRole: string, guild: Guild): Promise<Role> {
        let parsedRole: Role = undefined;

        parsedRole = await guild.roles.fetch(await CommandUtils.parseRoleID(potentialRole, guild));
        if(parsedRole === null) {
            parsedRole = await CommandUtils.parseRoleByName(potentialRole, guild);
        }

        return(parsedRole);
    }

    static async parseRoleByName(potentialRole: string, guild: Guild): Promise<Role> {
        let parsedRole: Role = undefined;
        let roleCache: Collection<Snowflake, Role> = guild.roles.cache;

        for(let role of roleCache.values()) {
            if(role.name.toLowerCase() === potentialRole.toLowerCase()) {
                parsedRole = role;
                break;
            }
        }

        return(parsedRole);
    }

    static async parseRoleID(potentialRole: string, guild: Guild): Promise<Snowflake> {
        let snowflake: Snowflake = potentialRole;
        if(snowflake.startsWith("<@&") && snowflake.endsWith(">"))
            snowflake = snowflake.substring(3, snowflake.length - 1);
        
        return(snowflake);
    }

    static async parseTextChannel(potentialChannel: string, client: Client): Promise<TextChannel | NewsChannel | DMChannel> {
        let channel: Channel = await CommandUtils.parseChannel(potentialChannel, client);
        let parsedTextChannel: TextChannel | NewsChannel | DMChannel = undefined;

        if(channel === undefined) {
            return(undefined);
        }

        switch(channel.type) {
            case "text":
                parsedTextChannel = <TextChannel>channel;
                break;
            case "news":
                parsedTextChannel = <NewsChannel>channel;
                break;
            case "dm":
                parsedTextChannel = <DMChannel>channel;
                break;
        }

        return(parsedTextChannel);
    }

    static async parseChannel(potentialChannel: string, client: Client): Promise<Channel> {
        let parsedChannel: Channel = undefined;

        try {
            parsedChannel = await client.channels.fetch(await CommandUtils.parseChannelID(potentialChannel));
        }
        catch(err) {
            let parsedUser: User = await CommandUtils.parseUser(potentialChannel, client);
            if(parsedUser !== undefined) {
                parsedChannel = await parsedUser.createDM();
            }
        }

        return(parsedChannel);
    }

    static async parseChannelID(potentialChannel: string): Promise<Snowflake> {
        let snowflake: Snowflake = potentialChannel;
        if(snowflake.startsWith("<#") && snowflake.endsWith(">")) {
            snowflake = snowflake.substring(2, potentialChannel.length - 1);
        }

        return(snowflake);
    }

    static async parseEmote(potentialEmote: string, client: Client): Promise<Emoji> {
        let parsedEmote: Emoji = undefined;

        try {
            parsedEmote = client.emojis.resolve(await CommandUtils.parseEmoteID(potentialEmote));
        }
        catch(err) {
            parsedEmote = await CommandUtils.parseEmoteByName(potentialEmote, client);
        }

        return(parsedEmote);
    }

    static async parseEmoteByName(potentialEmote: string, client: Client): Promise<Emoji> {
        let emoteCache: Emoji[] = client.emojis.cache.array();

        for(let currEmote of emoteCache) {
            if(currEmote.name.toLowerCase() === potentialEmote.toLowerCase()) {
                return(currEmote);
            }
        }

        return(undefined);
    }

    static async parseEmoteID(potentialEmote: string): Promise<Snowflake> {
        let snowflake: Snowflake = potentialEmote;
        if(snowflake.startsWith("<:") && snowflake.endsWith(">")) {
            snowflake = snowflake.substring(snowflake.lastIndexOf(":") + 1, snowflake.length - 1);
        }

        return(snowflake);
    }

    static async parseWebhookUrl(potentialWebhook: string): Promise<WebhookClient> {
        "https://canary.discordapp.com/api/webhooks/406775579363377152/I3GxI-NKGLf1Zsjj5swsV0i_1krj0Dx1zXKT0znwHe_dltiJ2TR1hu4BwO8q5WUPWPhq"
        let webhook: WebhookClient = undefined;
        let splitUrl: string[] = potentialWebhook.split("/");

        if(splitUrl.length === 7) {
            webhook = new WebhookClient(splitUrl[5], splitUrl[6])
        }

        return(webhook);
    }
}