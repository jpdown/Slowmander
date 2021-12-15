import type { Command } from "commands/Command";
import type { Bot } from "Bot";
import { MessageActionRow, Message, MessageEmbed, User, InteractionCollector, TextBasedChannels, GuildMember, MessageButton, Interaction, MessageInteraction, ButtonInteraction } from 'discord.js';

export class ButtonPaginator {
    private elements: string[];
    private numPerPage: number;
    private page: number;
    private title: string;
    private msg: Message | undefined;
    private channel: TextBasedChannels;
    private bot: Bot;
    // private command: Command;
    private pages;

    constructor(elements: string[], numPerPage: number, title: string, channel: TextBasedChannels, bot: Bot) {
        this.elements = elements;
        this.numPerPage = numPerPage;
        this.page = 0;
        this.title = title;
        this.channel = channel;
        this.bot = bot;
        this.pages = Math.ceil(this.elements.length / this.numPerPage);
    }

    public async postMessage(): Promise<Message> {
        let emb = await this.generateEmbed();
        this.msg = await this.channel.send({ embeds: [emb] });
        let buttons;
        if (this.pages > 1) {
            buttons = new MessageActionRow()
                .addComponents(
                    new MessageButton().setCustomId('prev').setLabel('Previous').setStyle('PRIMARY'),
                    new MessageButton().setCustomId('next').setLabel('Next').setStyle('PRIMARY'));
            const intCollector = this.msg.createMessageComponentCollector({ //TODO not sure why the filtering doesn't work
                // filter: (interaction: ButtonInteraction, user: User) => !user.bot,
                componentType: 'BUTTON',
                time: 60000
            });
            this.msg.edit({components: [buttons]})
            intCollector.on('collect', this.onClick.bind(this));
            intCollector.on('end', async () => {
                await this.msg?.delete();
            })
        }
        return this.msg;
    }

    public async onClick(inter: MessageInteraction, user: User) {
        // TODO check for perms maybe?
        let button = inter.id;
        if (button === 'prev') {
            if (this.page + 1 < this.pages) {
                this.page += 1;
                await this.msg?.edit({ embeds: [await this.generateEmbed()] });
            }
        } else if (button === 'next') {
            if (this.page > 0) {
                this.page -= 1;
                await this.msg?.edit({ embeds: [await this.generateEmbed()] });
            }
        }
    }

    private async generateEmbed(): Promise<MessageEmbed> {
        const embed: MessageEmbed = new MessageEmbed()
            .setColor(await this.bot.utils.getSelfColor(this.channel))
            .setFooter(`Page ${this.page + 1} of ${this.pages}`)
            .setDescription(this.elements.slice(this.page * this.numPerPage, (this.page + 1) * this.numPerPage).join('\n'))
            .setTitle(this.title)
            .setTimestamp();
        return embed;
    }
}