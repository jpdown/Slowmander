import { ColorResolvable, TextChannel, DMChannel, NewsChannel, User, Client, Collection, Snowflake, Guild, GuildMember, Role } from "discord.js";

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

        if(potentialUser.startsWith("<@"))
            snowflake = potentialUser.substring(2, potentialUser.length - 1);
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
        if(potentialRole.startsWith("<@&"))
            snowflake = potentialRole.substring(3, potentialRole.length - 1);
        
        return(snowflake);
    }
}