import { Bot } from "Bot";
import { Message, User } from "discord.js";
import { Logger } from "Logger";

export class SpamChecker {
    private bot: Bot;
    private logger: Logger;
    private linkRegex =
        /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    private usersMap = new Map<User, number>();
    private lastMessage = new Map<User, Message>();

    constructor(bot: Bot) {
        this.bot = bot;
        this.logger = Logger.getLogger(this);
    }

    public async checkMessage(message: Message) {
        let user = message.author;

        if (user.bot) return;

        if (this.linkRegex.test(message.content)) {
            let lastMessage: Message | undefined = this.lastMessage.get(user);
            let count = this.usersMap.get(user) ?? 0;
            if (lastMessage && count > 0) {
                if (
                    this.linkRegex.test(message.content) &&
                    this.linkRegex.test(lastMessage.content) &&
                    lastMessage.createdAt.getSeconds() - message.createdAt.getSeconds() <= 3
                ) {
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
                await message.guild!.members.ban(user);
                this.usersMap.delete(user);
                this.lastMessage.delete(user);
            } else {
                this.lastMessage.set(user, message);
            }
        }

        return;
    }
}
