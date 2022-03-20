import { Bot } from "Bot";
import { Message, User } from "discord.js";
import { Logger } from "Logger";
import { ModErrorLog } from "moderrorlog/ModErrorLog";

export class SpamChecker {
    private readonly TIMEOUT = 3000;
    private bot: Bot;
    private logger: Logger;
    private linkRegex =
        /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/i;
    private usersMap = new Map<User, number>();
    private lastMessage = new Map<User, Message>();

    constructor(bot: Bot) {
        this.bot = bot;
        this.logger = Logger.getLogger(this);
    }

    public async checkMessage(message: Message) {
        let user = message.author;

        if (user.bot) return;

        if (!message.guildId) return; // don't run in DMs

        if (!this.bot.db.guildConfigs.getSpamBan(message.guildId)) return;

        if (this.linkRegex.test(message.content)) {
            let lastMessage: Message | undefined = this.lastMessage.get(user);
            let count = this.usersMap.get(user) ?? 0;
            if (lastMessage && count > 0) {
                let newLink = this.linkRegex.exec(message.content);
                let lastLink = this.linkRegex.exec(lastMessage.content);
                if (newLink![0] == lastLink![0] && message.createdAt.getTime() - lastMessage.createdAt.getTime() <= this.TIMEOUT) {
                    count++;
                } else {
                    this.usersMap.delete(user);
                    this.lastMessage.delete(user);
                }
            } else {
                count++;
            }

            this.usersMap.set(user, count);

            if (count == 3) {
                try {
                     await message.guild!.members.ban(user, {days: 1, reason: "SpamChecker: Caught link spam"});
                } catch (err) {
                    this.logger.warning(`Couldn't ban spammer ${user.toString()}`, err);
                    ModErrorLog.log(`Couldn't ban spammer ${user.toString()}, likely missing permissions.`, message.guild!, this.bot)
                }
                this.usersMap.delete(user);
                this.lastMessage.delete(user);
            } else {
                this.lastMessage.set(user, message);
                setTimeout(this.removeUser.bind(this), this.TIMEOUT, user);
            }
        }

        return;
    }

    private async removeUser(user: User) {
        const lastMessageTime = this.lastMessage.get(user)?.createdAt.getTime();
        const currentTime = new Date().getTime();
        if (lastMessageTime && currentTime - lastMessageTime > this.TIMEOUT) {
            this.lastMessage.delete(user);
            this.usersMap.delete(user);
        }
    }
}
