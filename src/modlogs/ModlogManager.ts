import { PantherBot } from "../Bot";
import { GuildMember, Message, Collection, Snowflake, Guild, User, Client, TextChannel, MessageEmbed, NewsChannel, DMChannel, GuildChannel, Role, GuildAuditLogsAction, GuildAuditLogsActionType, GuildAuditLogs, GuildAuditLogsEntry, Channel, Invite, PermissionResolvable, GuildAuditLogsTarget, AuditLogChange, GuildEmoji, Webhook, Integration, GuildAuditLogsActions, VoiceState } from "discord.js";
import { Logger } from "../Logger";
import { PermissionsHelper } from "../utils/PermissionsHelper";

export class ModlogManager {
    private bot: PantherBot;
    private logger: Logger;
    private channelMap: Map<Snowflake, string>;
    private eventListener: ModlogEventListener;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
        this.channelMap = new Map<Snowflake, string>();
        this.eventListener = new ModlogEventListener(bot);
    }

    public async logModAction(target: any, executor: User, changes: AuditLogChange[], timestamp: Date | number, action: string, guild: Guild, reason?: string): Promise<void> {
        let embed: MessageEmbed = new MessageEmbed();
        let channel: TextChannel | NewsChannel = await this.getLogChannel(guild.id);
        let targetString: string = "";

        // set author to executor
        embed.setAuthor(executor.username, executor.avatarURL());

        // add info about action
        embed.setDescription(action);

        if (target && target.name) {
            targetString += target.name;
        }
        else if (target && target.username) {
            targetString += target.username;
        }
        else if (target && target.id) {
            targetString += target.id;
        }

        if (target && target.toString() !== "") {
            targetString += " - " + target.toString();
        }

        if (targetString !== "") {
            embed.addField("Target", targetString);
        }

        if (changes !== undefined && changes !== null) {
            for (let change of changes) {
                embed.addField(change.key, `\`\`\`diff\n- ${change.old}\n+ ${change.new}\`\`\``);
            }
        }

        if (reason !== undefined && reason !== null) {
            embed.addField("Reason", reason);
        }

        embed.setTimestamp(timestamp);

        await channel.send(embed);
    }

    public async setModlogChannel(guildId: string, channelId: string): Promise<boolean> {
        let result: boolean = await this.bot.configs.guildConfig.setModlogChannel(guildId, channelId);
        if(result) this.channelMap.set(guildId, channelId);

        return(result)
    }

    private async getLogChannel(guildId: string): Promise<TextChannel | NewsChannel> {
        let channelId: Snowflake;

        if(this.channelMap.has(guildId)) {
            channelId = this.channelMap.get(guildId);
        }
        else {
            try {
                channelId = await this.bot.configs.guildConfig.getModlogChannel(guildId);
                if(channelId) {
                    this.channelMap.set(guildId, channelId);
                }
            }
            catch(err) {
                await this.logger.error("Error getting modlog channel", err);
            }
        }

        let channel: TextChannel | NewsChannel;

        try {
            if(channelId) {
                channel = <TextChannel | NewsChannel> await this.bot.client.channels.fetch(channelId);
            }
        }
        catch(err) {
            await this.logger.error("Error getting modlog channel from API", err);
        }

        return(channel);
    }
}

class ModlogEventListener {
    private logger: Logger;
    private bot: PantherBot;

    private loggedPrunes: Snowflake[];

    constructor(bot: PantherBot) {
        //Register events
        let client: Client = bot.client;
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
        this.loggedPrunes = [];
        client.on("channelCreate", this.onChannelCreate.bind(this));
        client.on("channelDelete", this.onChannelDelete.bind(this));
        client.on("channelUpdate", this.onChannelUpdate.bind(this));
        client.on("guildMemberRemove", this.onGuildMemberRemove.bind(this));
        client.on("guildBanAdd", this.onGuildBanAdd.bind(this));
        client.on("guildBanRemove", this.onGuildBanRemove.bind(this));
        client.on("guildMemberUpdate", this.onGuildMemberUpdate.bind(this));
        client.on("guildMemberAdd", this.onGuildMemberAdd.bind(this));
        client.on("roleCreate", this.onRoleCreate.bind(this));
        client.on("roleDelete", this.onRoleDelete.bind(this));
        client.on("roleUpdate", this.onRoleUpdate.bind(this));
        client.on("messageDelete", this.onMessageDelete.bind(this));
        client.on("messageDeleteBulk", this.onMessageDeleteBulk.bind(this));
        client.on("voiceStateUpdate", this.onVoiceStateUpdate.bind(this));
    }

    public async onChannelCreate(channel: DMChannel | GuildChannel) {
        //log CHANNEL_CREATE events
        if(channel.type === "dm") {
            return;
        }

        let guild: Guild = channel.guild;

        /*
        target: GuildChannel
        executor: User
        changes: name, type, permission_overwrites, nsfw, rate_limit_per_user, bitrate

        type:
        0 - TextChannel
        2 - VoiceChannel
        4 - Category
        5 - AnnouncementChannel
        */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["CHANNEL_CREATE"], channel.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onChannelDelete(channel: DMChannel | GuildChannel) {
        //log CHANNEL_DELETE events
        if(channel.type === "dm") {
            return;
        }

        let guild: Guild = channel.guild;

        /*
        */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["CHANNEL_DELETE"], channel.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onChannelUpdate(channel: DMChannel | GuildChannel) {
        //log CHANNEL_OVERWRITE_x events
        // also CHANNEL_UPDATE

        if(channel.type === "dm") {
            return;
        }

        let guild: Guild = channel.guild; //Verify we have permissions

        /* 
        overwrite:
        CREATE: changes: id (of role/member), type (role, member), allow, deny, allow_new, deny_new
        DELETE: changes: id (of role/member), type (role, member), allow, deny, allow_new, deny_new
        UPDATE: changes: allow/deny, possibly both, , allow_new, deny_new

        extra on all is either Role or GuildMember

        allow/deny has old and new, compare for changes

        update:
        changes:
            topic, nsfw, rate_limit_per_user, name, 
        */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["CHANNEL_OVERWRITE_CREATE", "CHANNEL_OVERWRITE_DELETE", "CHANNEL_OVERWRITE_UPDATE", "CHANNEL_UPDATE"], channel.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onGuildMemberRemove(member: GuildMember) {
        //Log kicks and (not right now but in the future) prunes

        let guild: Guild = member.guild;

        /*
        KICK
        target: user

        PRUNE
        delete_member_days
        members_removed
        */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["MEMBER_KICK"], member.id);
        // if we didn't find a kick, look for a prune
        if (matchingLog === undefined) {
            matchingLog = await this.getAuditLogEntry(guild, ["MEMBER_PRUNE"]);
        }

        if(matchingLog !== undefined && matchingLog.action === "MEMBER_PRUNE") {
            if(this.loggedPrunes.includes(matchingLog.id)) return;
            else {
                //Keep track that we've logged this prune
                this.loggedPrunes.push(matchingLog.id);
                //Queue a remove of this in 5 seconds (we ignore events that happened more than 5 seconds ago)
                setTimeout(async () => {
                    this.loggedPrunes.splice(this.loggedPrunes.indexOf(matchingLog.id, 1))
                }, 5000);
            }
        }

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onGuildBanAdd(guild: Guild, user: User) {
        /*
        target: User
        */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["MEMBER_BAN_ADD"], user.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onGuildBanRemove(guild: Guild, user: User) {
        /*
        target: User
        */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["MEMBER_BAN_REMOVE"], user.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember) {
        let guild: Guild = newMember.guild;
        /*
        NICK
        changes: id: "nick", old new
        executor CAN be the same user, make sure to ignore that (we can just ignore that globally)

        role updates
        changes: id: $add and $remove
        old undefined
        new is array of objects with params id and name (role id and name)
        */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["MEMBER_UPDATE", "MEMBER_ROLE_UPDATE"], newMember.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onGuildMemberAdd(member: GuildMember) {
        let guild: Guild = member.guild;
        
        //Check if member is a bot
        if(!member.user.bot) {
            return;
        }
        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["BOT_ADD"], member.id);

        /*
        changes: null
        reason: null
        target is bot User
        */

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onRoleCreate(role: Role) {
        let guild: Guild = role.guild;

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["ROLE_CREATE"], role.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onRoleDelete(role: Role) {
        let guild: Guild = role.guild;

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["ROLE_DELETE"], role.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onRoleUpdate(oldRole: Role, newRole: Role) {
        let guild: Guild = newRole.guild;

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["ROLE_UPDATE"], newRole.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onMessageDelete(message: Message) {
        if(message.partial) {
            return;
        }

        if(message.channel.type === "dm") {
            return;
        }

        let guild: Guild = message.guild;

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["MESSAGE_DELETE"], message.author.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onMessageDeleteBulk(messages: Collection<Snowflake, Message>) {
        if (messages.first().partial) {
            return;
        }

        if(messages.first().channel.type === "dm") {
            return;
        }

        let guild: Guild = messages.first().guild;

        /*
         * count
         */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["MESSAGE_BULK_DELETE"], messages.first().channel.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    public async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        let guild: Guild = newState.guild;

        /*
         */

        // Get log entry
        let matchingLog: GuildAuditLogsEntry = await this.getAuditLogEntry(guild, ["MEMBER_MOVE", "MEMBER_DISCONNECT"], newState.member?.id);

        if (matchingLog !== undefined) {
            console.log(matchingLog);
            await this.bot.modlogManager.logModAction(matchingLog.target, matchingLog.executor, matchingLog.changes, matchingLog.createdTimestamp, matchingLog.action, guild, matchingLog.reason);
        }
    }

    private globalAuditLogChecks(entry: GuildAuditLogsEntry, currentTime: Date, client: Client): boolean {
        let check: boolean = true;
        
        //Check timestamp is within 5 seconds
        if(currentTime.valueOf() - entry.createdAt.valueOf() > 5000) {
            check = false;
        }

        //Check that it wasn't the current bot user who did it (these will be logged by the command)
        if(check && entry.executor.id === client.user.id) {
            check = false;
        }

        //Check that if target is user, executer and target are not the same
        if(check && entry.targetType === "USER" && entry.target === entry.executor) {
            check = false;
        }

        return(check);
    }

    private async getAuditLogEntry(guild: Guild, matchedTypes: GuildAuditLogsAction[], targetId?: Snowflake): Promise<GuildAuditLogsEntry> {
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return undefined;
        }
        // TODO: add enable disable logic

        //Grab the most recent channel create event from audit log
        let auditLogs: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        try {
            // if only one type, we can filter during api request
            if (matchedTypes.length === 1) {
                auditLogs = (await guild.fetchAuditLogs({type: matchedTypes[0]})).entries;
            }
            // if multiple types, we need to filter after grabbing
            else {
                auditLogs = (await guild.fetchAuditLogs()).entries;
                auditLogs = auditLogs.filter((entry: GuildAuditLogsEntry) => (matchedTypes.indexOf(entry.action) !== -1));
            }

            auditLogs = auditLogs.filter((entry: GuildAuditLogsEntry) => this.globalAuditLogChecks(entry, currentTime, guild.client));
            
            // if matching target id
            if (targetId !== undefined && targetId !== null) {
                auditLogs = auditLogs.filter((entry: GuildAuditLogsEntry) => (!(entry.target instanceof Invite) && entry.target.id === targetId));
            }

            matchingLog = auditLogs.first();
            return matchingLog;
        }
        catch(err) {
            this.logger.warning("Error getting audit logs.", err);
            return undefined;
        }
    }
}
