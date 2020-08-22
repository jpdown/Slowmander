import { PantherBot } from "../Bot";
import { Logger } from "../Logger";

import { GuildMember, MessageReaction, User, Role } from "discord.js";
import { VerificationConfigObject } from "../config/VerificationConfig";

export class VerificationManager {
    private bot: PantherBot;
    private logger: Logger;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
    }

    public async onGuildMemberAdd(member: GuildMember) {
        //Check if guild has verification enabled
        if(!await this.bot.configs.guildConfig.getVerificationEnabled(member.guild.id)) {
            return;
        }

        //Grab verification config
        let verificationConfig: VerificationConfigObject = await this.bot.configs.verificationConfig.getVerificationConfig(member.guild.id);
        //If we couldn't get verification config, we should disable verification
        if(!verificationConfig) {
            await this.bot.configs.guildConfig.setVerificationEnabled(member.guild.id, false);
            return;
        }

        //Find role in guild
        let role: Role = member.guild.roles.resolve(verificationConfig.roleID);
        //If role not found, disable verification
        if(!role) {
            await this.bot.configs.guildConfig.setVerificationEnabled(member.guild.id, false);
            return;
        }

        //Try to assign role to user
        
    }

    public async onMessageReactionAdd(reaction: MessageReaction, user: User) {
        try {
            if(reaction.partial) {
                await reaction.fetch();
            }
        }
        catch(err) {
            await this.logger.error("Error fetching reaction.", err);
        }

        //Ignore bots
        if(user.bot) {
            return;
        }

        //Ignore reactions from DMs
        if(!reaction.message.guild || reaction.message.channel.type === 'dm') {
            return;
        }

        
    }
}