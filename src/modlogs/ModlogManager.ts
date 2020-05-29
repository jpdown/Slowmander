import { PantherBot } from "../Bot";
import { GuildMember, Message, Collection, Snowflake, Guild, User, Client, TextChannel, MessageEmbed, NewsChannel, DMChannel, GuildChannel, Role, GuildAuditLogsAction, GuildAuditLogsActionType, GuildAuditLogs, GuildAuditLogsEntry, Channel, Invite, PermissionResolvable } from "discord.js";
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

    public async logChannelPermsUpdate(channel: GuildChannel, action: "CREATE" | "DELETE" | "UPDATE", oldAllow: Permissions, 
        newAllow: Permissions, oldDeny: Permissions, newDeny: Permissions) {
            //Calculate new neutral
            let newNeutal: Permissions = 
    }

    public async setModlogChannel(guildId: string, channelId: string) {
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

    private loggedPrunes: Snowflake[];

    constructor(bot: PantherBot) {
        //Register events
        let client: Client = bot.client;
        this.logger = Logger.getLogger(bot, this);
        this.loggedPrunes = [];
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
    }

    public async onChannelUpdate(channel: DMChannel | GuildChannel) {
        //log CHANNEL_OVERWRITE_x events

        let currentTime: Date = new Date();

        if(channel.type === "dm") {
            return;
        }

        let guild: Guild = channel.guild;

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        /* 
        CREATE: changes: id (of role/member), type (role, member), allow, deny
        DELETE: changes: id (of role/member), type (role, member), allow, deny
        UPDATE: changes: allow/deny, possibly both

        extra on all is either Role or GuildMember

        allow/deny has old and new, compare for changes
        */

        try {
            auditLogs = await guild.fetchAuditLogs();
            matchingEntries = auditLogs.entries.filter((entry) => (this.globalAuditLogChecks(entry, currentTime, channel.client) && (entry.action === "CHANNEL_OVERWRITE_CREATE" || entry.action === "CHANNEL_OVERWRITE_UPDATE"
                || entry.action === "CHANNEL_OVERWRITE_DELETE") && (!(entry.target instanceof Invite) && entry.target.id === channel.id)));
            if(matchingEntries.size > 1) {
                matchingLog = matchingEntries.first();
                
                console.log("channel update");
                console.log(matchingLog);
                console.log("=================");
            }
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from channel update.", err);
            return
        }
    }

    public async onGuildMemberRemove(member: GuildMember) {
        //Log kicks and (not right now but in the future) prunes

        let currentTime: Date = new Date();
        let guild: Guild = member.guild;

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        /*
        KICK
        target: user
        */

        try {
            auditLogs = await guild.fetchAuditLogs();
            matchingEntries = auditLogs.entries.filter((entry) => (this.globalAuditLogChecks(entry, currentTime, member.client) && ((entry.action === "MEMBER_KICK" && (<User>entry.target).id === member.id)) || entry.action === "MEMBER_PRUNE"));
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();

                if(matchingLog.action === "MEMBER_PRUNE") {
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

                console.log("member kicked/pruned (maybe)");
                console.log(matchingLog);
                console.log("=================");
            }

            return;
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from member kicked/pruned.", err);
            return;
        }
    }

    public async onGuildBanAdd(guild: Guild, user: User) {
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        /*
        target: User
        */

        try {
            auditLogs = await guild.fetchAuditLogs({type: "MEMBER_BAN_ADD"});
            matchingEntries = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, guild.client) && (<User>entry.target).id === user.id);
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();

                console.log("member banned");
                console.log(matchingLog);
                console.log("=================");
            }
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from member banned.", err);
            return;
        }

    }

    public async onGuildBanRemove(guild: Guild, user: User) {
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        /*
        target: User
        */

        try {
            auditLogs = await guild.fetchAuditLogs({type: "MEMBER_BAN_REMOVE"});
            matchingEntries = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, guild.client) && (<User>entry.target).id === user.id);
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();
                
                console.log("member unbanned");
                console.log(matchingLog);
                console.log("=================");
            }
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from member unbanned.", err);
            return;
        }
    }

    public async onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember) {
        let guild: Guild = newMember.guild;
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        /*
        NICK
        changes: id: "nick", old new
        executor CAN be the same user, make sure to ignore that (we can just ignore that globally)

        role updates
        changes: id: $add and $remove
        old undefined
        new is array of objects with params id and name (role id and name)
        */

        try {
            auditLogs = await guild.fetchAuditLogs();
            matchingEntries = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, newMember.client) && (entry.action === "MEMBER_UPDATE" || entry.action === "MEMBER_ROLE_UPDATE") && (<User>entry.target).id === newMember.id);
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();
                console.log("member updated / role updated (maybe)");
                console.log(matchingLog);
                console.log("=================");
            }
            
            return;
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from member update / role update.", err);
            return;
        }
    }

    public async onGuildMemberAdd(member: GuildMember) {
        let guild: Guild = member.guild;
        let currentTime: Date = new Date();

        //Check if member is a bot
        if(!member.user.bot) {
            return;
        }

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        /*
        changes: null
        reason: null
        target is bot User
        */

        try {
            auditLogs = await guild.fetchAuditLogs({type: "BOT_ADD"});
            matchingEntries = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, member.client) && (<User>entry.target).id === member.id);
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();
                
                console.log("bot added");
                console.log(matchingLog);
                console.log("=================");
            }
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from bot add.", err);
            return;
        }

    }

    public async onRoleCreate(role: Role) {
        let guild: Guild = role.guild;
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        try {
            auditLogs = await guild.fetchAuditLogs({type: "ROLE_CREATE"});
            matchingEntries = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, role.client) && (<Role>entry.target).id === role.id);
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();

                console.log("role created");
                console.log(matchingLog);
                console.log("=================");
            }
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from role create.", err);
            return;
        }
    }

    public async onRoleDelete(role: Role) {
        let guild: Guild = role.guild;
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        try {
            auditLogs = await guild.fetchAuditLogs({type: "ROLE_DELETE"});
            matchingEntries = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, role.client) && (<Role>entry.target).id === role.id);
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();

                console.log("role deleted");
                console.log(matchingLog);
                console.log("=================");
            }
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from role delete.", err);
            return;
        }
    }

    public async onRoleUpdate(oldRole: Role, newRole: Role) {
        let guild: Guild = newRole.guild;
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        try {
            auditLogs = await guild.fetchAuditLogs({type: "ROLE_UPDATE"});
            matchingEntries = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, newRole.client) && (<Role>entry.target).id === newRole.id);
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();

                console.log("role updated");
                console.log(matchingLog);
                console.log("=================");
            }
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from role update.", err);
            return;
        }
    }

    //why isn't this logging?? TODO
    public async onMessageDelete(message: Message) {
        if(message.channel.type === "dm") {
            return;
        }

        let guild: Guild = message.guild;
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingEntries: Collection<Snowflake, GuildAuditLogsEntry>;
        let matchingLog: GuildAuditLogsEntry;

        try {
            auditLogs = await guild.fetchAuditLogs({type: "MESSAGE_DELETE"});
            matchingEntries = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, message.client) && !(entry.target instanceof Invite) && entry.target.id === message.id);
            if(matchingEntries.size > 0) {
                matchingLog = matchingEntries.first();

                console.log("message deleted");
                console.log(matchingLog);
                console.log("=================");
            }
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from message delete.", err);
            return;
        }

    }


    //TODO: Solve this issue
    public async onMessageDeleteBulk(messages: Collection<Snowflake, Message>) {
        if(messages.first().channel.type === "dm") {
            return;
        }

        let guild: Guild = messages.first().guild;
        let currentTime: Date = new Date();

        //Verify we have permissions
        if(!guild.me.hasPermission("VIEW_AUDIT_LOG")) {
            return;
        }

        //Grab the most recent channel create event from audit log
        let auditLogs: GuildAuditLogs;
        let matchingLog: GuildAuditLogsEntry;

        try {
            auditLogs = await guild.fetchAuditLogs({type: "MESSAGE_BULK_DELETE"});
            matchingLog = auditLogs.entries.filter((entry) => this.globalAuditLogChecks(entry, currentTime, guild.client)).first();
        }
        catch(err) {
            this.logger.warning("Error getting audit logs from message delete.", err);
            return;
        }

        console.log("message deleted bulk");
        console.log(matchingLog);
        console.log("=================");
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
}