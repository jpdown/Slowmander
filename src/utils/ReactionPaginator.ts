import { MessageReaction, Message, MessageEmbed, TextChannel, NewsChannel, DMChannel, User, CollectorFilter, ReactionCollector } from "discord.js";
import { CommandUtils } from "./CommandUtils";
import { Command } from "../commands/Command";
import { PermissionsHelper } from "./PermissionsHelper";
import { PantherBot } from "../Bot";

export class ReactionPaginator {
    public static readonly NEXT_PAGE: string = "➡️";
    public static readonly PREV_PAGE: string = "⬅️";

    private elements: string[];
    private numPerPage: number;
    private currPage: number;
    private title: string;
    private message: Message;
    private channel: TextChannel | NewsChannel | DMChannel;
    private bot: PantherBot;
    private command: Command;
    private numPages: number;

    constructor(elements: string[], numPerPage: number, title: string, channel: TextChannel | NewsChannel | DMChannel, bot: PantherBot, command: Command) {
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
        this.message = await this.channel.send(await this.generateEmbed());
        if(this.numPages > 1) {
            await this.message.react(ReactionPaginator.PREV_PAGE);
            await this.message.react(ReactionPaginator.NEXT_PAGE);
            
            //Handle reactions
            let reactionFilter: CollectorFilter = (reaction: MessageReaction, user: User) =>  {
                return !user.bot && (reaction.emoji.name === ReactionPaginator.NEXT_PAGE || reaction.emoji.name === ReactionPaginator.PREV_PAGE);
            }
            let reactionCollector: ReactionCollector = this.message.createReactionCollector(reactionFilter, {time: 60000, dispose: true});
            reactionCollector.on("collect", this.onReaction.bind(this));
            reactionCollector.on("end", async (collected) => {
                await this.message.delete();
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
                    await this.message.edit(await this.generateEmbed());
                }
                break;
            case ReactionPaginator.PREV_PAGE:
                if(this.currPage > 0) {
                    this.currPage--;
                    await this.message.edit(await this.generateEmbed());
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
        let hasPerms: boolean;

        if(reaction.message.guild) {
            hasPerms = await PermissionsHelper.checkPermsAndDM(reaction.message.guild.member(user), this.command, this.bot);
        }
        else {
            hasPerms = await PermissionsHelper.checkPermsAndDM(user, this.command, this.bot);
        }

        return(hasPerms);
    }
}