import { PantherBot } from "../Bot";
import { Logger } from "../Logger";

import { GuildMember, Message } from "discord.js";
import { ModErrorLog } from "../moderrorlog/ModErrorLog";

export class HondeBannerManager {
    private bot: PantherBot;
    private logger: Logger;

    constructor(bot: PantherBot) {
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
    }

    public async onGuildMemberAdd(member: GuildMember) {
        // Check if this is MiloHax (quick and dirty) or the user does not contain h0nde
        if(member.guild.id !== "207306795784339458" || !(member.user.username.toLocaleLowerCase().includes("twitter.com/h0nde"))) {
            return;
        }

        // Try to ban user
        try {
            await member.ban();
        }
        catch(err) {
            await ModErrorLog.log("Unknown error banning h0nde bot " + member.user.tag, member.guild, this.bot);
            await this.logger.error(`Error banning h0nde bot ${member.user.tag} in guild ${member.guild.name}.`, err);
        }
    }

    public async onMessage(message: Message) {
        //Handle partial events
        try {
            if(message.partial) {
                await message.fetch();
            }
        }
        catch(err) {
            await this.logger.warning("Error fetching message.", err);
            return;
        }

        // Check if MiloHax discord
        if (!message.guild || message.guild.id !== "207306795784339458") {
            return;
        }
        // Check if this is a h0nde join message
        if (message.type !== "GUILD_MEMBER_JOIN" || !(message.author.username.toLocaleLowerCase().includes("twitter.com/h0nde"))) {
            return;
        }

        // Try to delete h0nde join message
        try {
            await message.delete();
        }
        catch(err) {
            await ModErrorLog.log("Unknown error deleting h0nde bot join message.", message.guild, this.bot);
            await this.logger.error(`Error deleting h0nde bot join message in guild ${message.guild.name}.`, err);
        }
    }
}