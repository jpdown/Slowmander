import { PantherBot } from "../Bot";
import { Logger } from "../Logger";

import { GuildMember } from "discord.js";
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
}