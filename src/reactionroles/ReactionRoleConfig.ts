import * as fs from 'fs';
import { Message, Emoji, Role, User, GuildMember, TextChannel, Client, NewsChannel } from 'discord.js';
import { PantherBot } from '../Bot';
import { LogLevel } from '../Logger';

export class ReactionRoleConfig {
    readonly CONFIG_PATH: string = "./data/reactionroles/";

    private reactionRoleMessages: Map<string, ReactionRole[]>;
    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.reactionRoleMessages = new Map<string, ReactionRole[]>();
        this.bot = bot;
        this.loadConfigs();
    }

    public loadConfigs(): void {
        //Get all files in dir
        if(!fs.existsSync(this.CONFIG_PATH)) {
            return;
        }

        let jsonFiles: string[] = fs.readdirSync(this.CONFIG_PATH);
        let currReactionRole: ReactionRole;
        let currJsonData: string;
        let currMessage: ReactionRole[];

        for(let jsonFile of jsonFiles) {
            try {
                currJsonData = fs.readFileSync(this.CONFIG_PATH + jsonFile).toString();
                currReactionRole = <ReactionRole>JSON.parse(currJsonData);

                if(!this.reactionRoleMessages.has(currReactionRole.messageID)) {
                    this.reactionRoleMessages.set(currReactionRole.messageID, []);
                }
                currMessage = this.reactionRoleMessages.get(currReactionRole.messageID);
                currMessage.push(currReactionRole);
            }
            catch(err) {
                this.bot.logger.logSync(LogLevel.ERROR, `Error loading reaction role ${jsonFile}`, err);
            }
        }

    }
    
    public saveConfigs(): void {
        if(!fs.existsSync("data"))
            fs.mkdirSync("data");
        
        if(fs.existsSync(this.CONFIG_PATH))
            fs.rmdirSync(this.CONFIG_PATH, {recursive: true});
        fs.mkdirSync(this.CONFIG_PATH);

        let currJsonFile: string;
        let currJsonData: string;

        for(let reactionRoles of this.reactionRoleMessages.values()) {
            for(let currReactionRole of reactionRoles) {
                currJsonFile = this.CONFIG_PATH + currReactionRole.name + ".json";
                
                try {
                    currJsonData = JSON.stringify(currReactionRole);
                    fs.writeFileSync(currJsonFile, currJsonData);
                }
                catch(err) {
                    this.bot.logger.logSync(LogLevel.ERROR, `Error saving reaction role ${currJsonFile}`, err);
                }
            }
        }
    }

    public async getFromName(name: string): Promise<ReactionRole> {
        for(let reactionRoles of this.reactionRoleMessages.values()) {
            for(let currReactionRole of reactionRoles) {
                if(currReactionRole.name === name) {
                    return(currReactionRole);
                }
            }
        }

        return(undefined);
    }

    public async getFromReaction(message: Message, emote: Emoji): Promise<ReactionRole> {
        try {
            let reactionRoles: ReactionRole[] = this.reactionRoleMessages.get(message.id);
            for(let currReactionRole of reactionRoles) {
                if(currReactionRole.emoteID === emote.id) {
                    return(currReactionRole);
                }
            }
        }
        catch(err) {
            return(undefined);
        }
    }

    public async getAll(): Promise<ReactionRole[]> {
        let reactionRolesList: ReactionRole[] = [];
        for(let reactionRoles of this.reactionRoleMessages.values()) {
            reactionRolesList = reactionRolesList.concat(reactionRoles);
        }

        return(reactionRolesList);
    }

    public async has(name: string): Promise<boolean> {
        if(await this.getFromName(name) !== undefined) {
            return(true);
        }

        return(false);
    }

    public async add(message: Message, emote: Emoji, role: Role, name: string): Promise<boolean> {
        let messageID: string = message.id;
        let channelID: string = message.channel.id;
        let emoteID: string = emote.id;
        let roleID = role.id;

        let reactionRoles: ReactionRole[];

        //Check if we already have it, failing if we do
        if(await this.has(name)) {
            return(false);
        }

        //If messageID not already here, make it
        if(!this.reactionRoleMessages.has(messageID)) {
            this.reactionRoleMessages.set(messageID, []);
        }
        reactionRoles = this.reactionRoleMessages.get(messageID);

        //Add new reaction role object
        reactionRoles.push({
            channelID: channelID,
            messageID: messageID,
            emoteID: emoteID,
            roleID: roleID,
            name: name,
        })

        //Add reaction to message
        await message.react(emoteID);

        //Save configs
        this.saveConfigs();

        return(true);
    }

    public async remove(name: string, client: Client): Promise<boolean> {
        let reactionRoles: ReactionRole[];

        //Iterate over all reaction roles looking for role with name
        for(let reactionRoles of this.reactionRoleMessages.values()) {
            for(let i = 0; i < reactionRoles.length; i++) {
                if(reactionRoles[i].name === name) {
                    //Remove reaction from message (if we have perms)
                    try {
                        let channel: TextChannel | NewsChannel = <TextChannel | NewsChannel>await client.channels.fetch(reactionRoles[i].channelID);
                        let message: Message = await channel.messages.fetch(reactionRoles[i].messageID);
                        await message.reactions.cache.get(reactionRoles[i].emoteID).users.remove(client.user);
                    }
                    catch(err) {
                        await this.bot.logger.log(LogLevel.ERROR, "ReactionRoles:remove Error removing reaction from message.", err);
                    }

                    //Remove the element
                    reactionRoles.splice(i, 1);
                    this.saveConfigs()

                    return(true);
                }
            }
        }

        return(false);
    }

    public async addUser(member: GuildMember, reactionRole: ReactionRole, channel: TextChannel | NewsChannel) {
        try {
            let role: Role = await channel.guild.roles.fetch(reactionRole.roleID);
            await member.roles.add(role);
        }
        catch(err) {
            await channel.send(`There was an error adding the role to ${member.toString()}. <@${this.bot.credentials.owner}>, check logs.`);
            await this.bot.logger.log(LogLevel.ERROR, `ReactionRoles:addUser Error adding reaction role ${reactionRole.name} to ${member.user.username}#${member.user.discriminator}`, err);
        }
    }

    public async removeUser(member: GuildMember, reactionRole: ReactionRole, channel: TextChannel | NewsChannel) {
        try {
            let role: Role = await channel.guild.roles.fetch(reactionRole.roleID);
            await member.roles.remove(role);
        }
        catch(err) {
            await channel.send(`There was an error removing the role from ${member.toString()}. <@${this.bot.credentials.owner}>, check logs.`);
            await this.bot.logger.log(LogLevel.ERROR, `ReactionRoles:removeUser Error removing reaction role ${reactionRole.name} to ${member.user.username}#${member.user.discriminator}`, err);
        }
    }
}

export interface ReactionRole {
    channelID: string,
    messageID: string,
    emoteID: string,
    roleID: string,
    name: string
}