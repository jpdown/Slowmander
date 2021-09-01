import { CommandUtils } from "utils/CommandUtils";
import { Command } from "commands/Command";
import { PermissionsHelper } from "utils/PermissionsHelper";
import { Bot } from "Bot";

import { MessageReaction, Message, MessageEmbed, User, ReactionCollector, TextBasedChannels, GuildMember } from "discord.js";

export class ReactionPaginator {
    public static readonly NEXT_PAGE: string = "➡️";
    public static readonly PREV_PAGE: string = "⬅️";

    private elements: string[];
    private numPerPage: number;
    private currPage: number;
    private title: string;
    private message: Message | undefined;
    private channel: TextBasedChannels;
    private bot: Bot;
    private command: Command;
    private numPages: number;

    constructor(elements: string[], numPerPage: number, title: string, channel: TextBasedChannels, bot: Bot, command: Command) {
        this.elements = elements;
        this.numPerPage = numPerPage;
        this.currPage = 0;
        this.title = title;
        this.channel = channel;
        this.bot = bot;
        this.command = command;
        this.numPages = Math.ceil(this.elements.length / this.numPerPage);
    }

    public async postMessage(): Promise<Message> {
        this.message = await this.channel.send({embeds: [await this.generateEmbed()]});
        if(this.numPages > 1) {
            await this.message.react(ReactionPaginator.PREV_PAGE);
            await this.message.react(ReactionPaginator.NEXT_PAGE);
            
            //Handle reactions
            let reactionCollector: ReactionCollector = this.message.createReactionCollector({filter: (reaction: MessageReaction, user: User) => {
                return !user.bot && (reaction.emoji.name === ReactionPaginator.NEXT_PAGE || reaction.emoji.name === ReactionPaginator.PREV_PAGE)
            },
            time: 60000, dispose: true});

            reactionCollector.on("collect", this.onReaction.bind(this));
            reactionCollector.on("end", async (collected) => {
                await this.message?.delete();
            })
        }

        return this.message;
    }

    public async onReaction(reaction: MessageReaction, user: User) {
        if(!await this.checkPerms(reaction, user)) {
            return;
        }

        switch(reaction.emoji.name) {
            case ReactionPaginator.NEXT_PAGE:
                if(this.currPage + 1 < this.numPages) {
                    this.currPage++;
                    await this.message?.edit({embeds: [await this.generateEmbed()]});
                }
                break;
            case ReactionPaginator.PREV_PAGE:
                if(this.currPage > 0) {
                    this.currPage--;
                    await this.message?.edit({embeds: [await this.generateEmbed()]});
                }
                break;
        }

        try {
            await reaction.users.remove(user);
        }
        catch(err) {
            await reaction.message.channel.send("I do not have permissions to remove the reaction.");
        }
    }
    
    private async generateEmbed(): Promise<MessageEmbed> {
        let embed: MessageEmbed = new MessageEmbed()
            .setColor(await CommandUtils.getSelfColor(this.channel, this.bot))
            .setFooter(`Page ${this.currPage + 1} of ${this.numPages}`)
            .setDescription(this.elements.slice(this.currPage * this.numPerPage, (this.currPage + 1) * this.numPerPage).join("\n"))
            .setTitle(this.title);
        
        return(embed)
    }

    private async checkPerms(reaction: MessageReaction, user: User): Promise<boolean> {
        let hasPerms: boolean = false;

        if(reaction.message.guild) {
            let member: GuildMember | undefined = reaction.message.guild.members.cache.get(user.id);
            if (member) {
                hasPerms = await PermissionsHelper.checkPermsAndDM(member, this.command, this.bot);
            }
        }
        else {
            hasPerms = await PermissionsHelper.checkPermsAndDM(user, this.command, this.bot);
        }

        return(hasPerms);
    }
}