import { ColorResolvable, TextChannel, DMChannel, NewsChannel, User, Client, Collection, Snowflake, Guild, GuildMember, Role, Channel, GuildEmoji, WebhookClient, SnowflakeUtil, DeconstructedSnowflake, GuildChannel, Permissions, PermissionOverwriteOptions, PermissionOverwriteOption, Message, MessageReaction, ReactionEmoji, MessageEmbed, MessageOptions } from "discord.js";
import { PantherBot } from "../Bot";

export class CommandUtils {
    static async getSelfColor(channel: TextChannel | DMChannel | NewsChannel, bot: PantherBot): Promise<ColorResolvable> {
        let color: ColorResolvable;

        if(channel.type === "text" || channel.type === "news") {
            color = channel.guild.me.displayColor;
        }

        //If no color or color is black, we want default color
        if(!color || color === 0) {
            color = await bot.configs.botConfig.getDefaultColor();
        }

        return(color);
    }

    static async splitCommandArgs(args: string, startPos?: number): Promise<string[]> {
        if(startPos === undefined)
            startPos = 0;
        return(args.slice(startPos).split(/ +/));
    }

    static async parseMember(potentialMember: string, guild: Guild): Promise<GuildMember> {
        let parsedMember: GuildMember = undefined;
        let parsedUser: User = await CommandUtils.parseUser(potentialMember, guild.client);

        if(!parsedUser) {
            parsedMember = await this.parseMemberNickname(potentialMember, guild);
        }
        else {
            parsedMember = guild.member(parsedUser);
        }

        return(parsedMember);
    }

    static async parseMemberNickname(potentialMember: string, guild: Guild): Promise<GuildMember> {
        let parsedMember: GuildMember = undefined;

        for(let member of guild.members.cache.array()) {
            if(member.nickname && member.nickname.toLowerCase().startsWith(potentialMember.toLowerCase())) {
                parsedMember = member;
                break;
            }
        }

        return(parsedMember);
    }

    static async parseMemberPingOnly(potentialMember: string, guild: Guild): Promise<GuildMember> {
        let parsedUser: User = await CommandUtils.parseUserPingOnly(potentialMember, guild.client);

        return(guild.member(parsedUser));
    }

    static async parseUser(potentialUser: string, client: Client): Promise<User> {
        let parsedUser: User = undefined;

        parsedUser = await CommandUtils.parseUserPingOnly(potentialUser, client);

        if(!parsedUser) {
            parsedUser = await CommandUtils.parseUserByName(potentialUser, client);
        }

        return(parsedUser);
    }

    static async parseUserPingOnly(potentialUser: string, client: Client): Promise<User> {
        let parsedUser: User = undefined;

        try {
            let snowflake: Snowflake = await CommandUtils.parseUserID(potentialUser);
            if(snowflake) {
                parsedUser = await client.users.fetch(snowflake);
            }
        }
        catch(err) {}

        return(parsedUser);
    }

    static async parseUserByName(potentialUser: string, client: Client): Promise<User> {
        let parsedUser: User = undefined;
        let userCache: Collection<Snowflake, User> = client.users.cache;

        for(let user of userCache.values()) {
            if(user.username.toLowerCase().startsWith(potentialUser.toLowerCase()) || `${user.username}#${user.discriminator}` === potentialUser) {
                parsedUser = user;
                break;
            }
        }

        return(parsedUser);
    }

    static async parseUserID(potentialUser: string): Promise<Snowflake> {
        let snowflake: string = potentialUser;

        if(snowflake.startsWith("<@") && snowflake.endsWith(">")) {
            snowflake = snowflake.substring(2, snowflake.length - 1);
        }
        if(snowflake.startsWith("!")) {
            snowflake = snowflake.substring(1);
        }
        
        if(!await CommandUtils.verifySnowflake(snowflake)) {
            snowflake = undefined;
        }

        return(snowflake);
    }

    static async parseRole(potentialRole: string, guild: Guild): Promise<Role> {
        let parsedRole: Role = undefined;
        let snowflake: Snowflake = await CommandUtils.parseRoleID(potentialRole, guild);

        if(snowflake) {
            parsedRole = await guild.roles.fetch(snowflake);
        }
        
        if(!parsedRole || parsedRole === null) {
            parsedRole = await CommandUtils.parseRoleByName(potentialRole, guild);
        }

        return(parsedRole);
    }

    static async parseRoleByName(potentialRole: string, guild: Guild): Promise<Role> {
        let parsedRole: Role = undefined;
        let roleCache: Collection<Snowflake, Role> = guild.roles.cache;

        if(potentialRole === "everyone") {
            parsedRole = guild.roles.everyone;
        }
        else {
            for(let role of roleCache.values()) {
                if(role.name.toLowerCase() === potentialRole.toLowerCase()) {
                    parsedRole = role;
                    break;
                }
            }
        }

        return(parsedRole);
    }

    static async parseRoleID(potentialRole: string, guild: Guild): Promise<Snowflake> {
        let snowflake: Snowflake = potentialRole;
        if(snowflake.startsWith("<@&") && snowflake.endsWith(">")) {
            snowflake = snowflake.substring(3, snowflake.length - 1);
        }

        if(!await CommandUtils.verifySnowflake(snowflake)) {
            snowflake = undefined;
        }
        
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
            let snowflake = await CommandUtils.parseChannelID(potentialChannel);
            if(snowflake) {
                parsedChannel = await client.channels.fetch(snowflake);
            }
        }
        catch(err) {}
        
        if(!parsedChannel) {
            let parsedUser: User = await CommandUtils.parseUserPingOnly(potentialChannel, client);
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

        if(!await CommandUtils.verifySnowflake(snowflake)) {
            snowflake = undefined;
        }

        return(snowflake);
    }

    static async parseEmote(potentialEmote: string, client: Client): Promise<GuildEmoji> {
        let parsedEmote: GuildEmoji = undefined;

        try {
            let snowflake: Snowflake = await CommandUtils.parseEmoteID(potentialEmote);
            if(snowflake) {
                parsedEmote = client.emojis.resolve(snowflake);
            }
        }
        catch(err) {}
        
        if(!parsedEmote) {
            parsedEmote = await CommandUtils.parseEmoteByName(potentialEmote, client);
        }
        return(parsedEmote);
    }

    static async parseEmoteByName(potentialEmote: string, client: Client): Promise<GuildEmoji> {
        let emoteCache: GuildEmoji[] = client.emojis.cache.array();

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

        if(!await CommandUtils.verifySnowflake(snowflake)) {
            snowflake = undefined;
        }

        return(snowflake);
    }

    static async parseWebhookUrl(potentialWebhook: string): Promise<WebhookClient> {
        let webhook: WebhookClient = undefined;
        let splitUrl: string[] = potentialWebhook.split("/");

        if(splitUrl.length === 7) {
            webhook = new WebhookClient(splitUrl[5], splitUrl[6])
        }

        return(webhook);
    }

    static async verifySnowflake(potentialSnowflake: string): Promise<boolean> {
        const discordEpoch: number = 1420070400000;

        //If doesn't consist solely of digits
        if(!/^\d*$/.test(potentialSnowflake)) {
            return(false);
        }
        
        //Deconstruct snowflake
        let deconstructedSnowflake: DeconstructedSnowflake = SnowflakeUtil.deconstruct(potentialSnowflake);
        if(deconstructedSnowflake.timestamp <= discordEpoch) {
            return(false);
        }

        //We good
        return(true);
    }

    static async updateChannelPerms(channel: GuildChannel, roles: Role[], users: User[], grantedPerms: Permissions, revokedPerms: Permissions, neutralPerms: Permissions, reason?: string): Promise<boolean> {
        //Check if we have permissions to edit channel
        if(!channel.permissionsFor(channel.client.user).has(Permissions.FLAGS.MANAGE_CHANNELS)) {
            return(false);
        }

        //Remove ADMINISTRATOR (channels don't have ADMINISTRATOR)
        if(grantedPerms.has(Permissions.FLAGS.ADMINISTRATOR)) {
            grantedPerms.remove(Permissions.FLAGS.ADMINISTRATOR);
        }
        if(revokedPerms.has(Permissions.FLAGS.ADMINISTRATOR)) {
            revokedPerms.remove(Permissions.FLAGS.ADMINISTRATOR);
        }
        if(neutralPerms.has(Permissions.FLAGS.ADMINISTRATOR)) {
            neutralPerms.remove(Permissions.FLAGS.ADMINISTRATOR);
        }

        //Make overwrite options object
        let overwriteOptions: PermissionOverwriteOption = {}
        for(let perm of grantedPerms.toArray()) {
            overwriteOptions[perm] = true;
        }
        for(let perm of revokedPerms.toArray()) {
            overwriteOptions[perm] = false;
        }
        for(let perm of neutralPerms.toArray()) {
            overwriteOptions[perm] = null;
        }

        //Try to update permissions
        try {
            for(let role of roles) {
                await channel.updateOverwrite(role, overwriteOptions, reason);
            }
            for(let user of users) {
                await channel.updateOverwrite(user, overwriteOptions, reason);
            }
            return(true);
        }
        catch(err) {
            throw(err);
        }
    }

    static async getEmote(message: Message, bot: PantherBot): Promise<ReactionEmoji | GuildEmoji> {
        //Ask for emote
        let sentMessage: Message = await CommandUtils.sendMessage("Please react on this message with the emote you would like to use.", message.channel, bot);
        let reactions: Collection<string, MessageReaction> = await sentMessage.awaitReactions((reaction, user) => user.id === message.author.id, {time:60000, max: 1});

        //Check if unicode or if we have the custom emote
        if(reactions.size < 1) {
            await CommandUtils.sendMessage("No reaction given, cancelling.", message.channel, bot);
            return undefined;
        }

        let emote: ReactionEmoji | GuildEmoji = reactions.first().emoji;
        if(emote.id && emote instanceof ReactionEmoji) {
            await CommandUtils.sendMessage("I do not have access to the emote given, cancelling.", message.channel, bot);
            emote = undefined;
        }

        return(emote);
    }

    static async sendMessage(message: string, channel: TextChannel | DMChannel | NewsChannel, bot: PantherBot): Promise<Message> {
        let messageSent: Message;

        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(channel, bot))
            .setDescription(message);

        messageSent = await channel.send(embed);

        return(messageSent);
    }

    public static async makeEmoteFromId(emoteId: string, message: Message): Promise<string> {
        let emote: string;

        try {
            emoteId = emoteId.split(":").pop();
            emote = message.client.emojis.resolve(emoteId).toString();
        }
        catch(err) {
            if(emoteId.indexOf(":") === -1) {
                emote = decodeURI(emoteId);
            }
            else {
                emote = emoteId;
            }
        }

        return(emote);
    }
}