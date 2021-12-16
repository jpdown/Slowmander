import type { Command } from "commands/Command";
import type { Bot } from "Bot";
import { MessageActionRow, Message, MessageEmbed, User, InteractionCollector, TextBasedChannels, GuildMember, MessageButton, Interaction, MessageInteraction, ButtonInteraction, CommandInteraction } from 'discord.js';
import type { CommandContext } from "CommandContext";
import { Logger } from "Logger";

export class ButtonPaginator {
    private cont: CommandContext;
    private desc: string; //need to rename this if i even keep using it lmfao
    private inter?: CommandInteraction;
    private elements: string[];
    private numPerPage: number;
    private page: number;
    private title: string;
    private msg: Message | undefined;
    private channel: TextBasedChannels;
    private bot: Bot;
    // private command: Command;
    private pages;
    private logger: Logger;

    constructor(elements: string[], cont: CommandContext, numPerPage: number, title: string, desc: string) {
        this.elements = elements;
        this.cont = cont;
        this.numPerPage = numPerPage;
        this.page = 0;
        this.title = title;
        this.desc = desc;
        this.channel = cont.channel;
        this.bot = cont.bot;
        this.pages = Math.ceil(this.elements.length / this.numPerPage);
        this.logger = Logger.getLogger(this);
    }

    public async postMessage() { //TODO still getting unkown interaction and idk why anymore
        let emb = await this.generateEmbed();
        // this.inter.deferReply({ephemeral: true}).then(console.log).catch(console.error)
        let tmpMsg = await this.cont.reply({ embeds: [emb] });
        if (!(tmpMsg instanceof Message)) {
            this.logger.warning("Got an APIMessage or undefined trying to create a button paginator.");
            return;
        }
        this.msg = tmpMsg;
        let buttons;
        if (this.pages > 1) {
            buttons = new MessageActionRow()
                .addComponents(
                    new MessageButton().setCustomId('prev').setLabel('Previous').setStyle('PRIMARY'),
                    new MessageButton().setCustomId('next').setLabel('Next').setStyle('PRIMARY'));
            const intCollector = this.msg.createMessageComponentCollector({
                filter: (interaction: ButtonInteraction) => interaction.message.id === this.msg?.id,
                componentType: 'BUTTON',
                time: 60000
            });
            buttons.components[0].setDisabled(true);
            buttons.components
            await this.msg.edit({embeds: [emb], components: [buttons]})
            intCollector.on('collect', this.onClick.bind(this))
            intCollector.on('end', async () => {
                await this.msg?.delete();
            });
        }
    }

    public async onClick(inter: Interaction) { //TODO add proper filtering, only work in given instance
        // TODO check for perms maybe?
        if (!(inter instanceof ButtonInteraction)) return;
        let com = inter.message?.components;
        if (!com) return;
        if (!(com.length === 0) && !(com[0] instanceof MessageActionRow)) return;
        let button = inter.customId;
        if (button === 'next') {
            if (this.page + 1 < this.pages) {
                this.page += 1;
            }
        } else if (button === 'prev') {
            if (this.page > 0) {
                this.page -= 1;
            }
        }
        if (this.page === 0) {
            com[0].components[0].disabled = true;
        } else if (this.page === this.pages-1) {
            com[0].components[1].disabled = true;
        } else {
            com[0].components[0].disabled = false;
            com[0].components[1].disabled = false;
        }
        await inter.update({ embeds: [await this.generateEmbed()], components: com as MessageActionRow[] });
    }

    private async generateEmbed(): Promise<MessageEmbed> {
        const embed: MessageEmbed = new MessageEmbed()
            .setColor(await this.bot.utils.getSelfColor(this.channel))
            .setFooter(`Page ${this.page + 1} of ${this.pages}`)
            .setDescription(this.elements.slice(this.page * this.numPerPage, (this.page + 1) * this.numPerPage).join('\n'))
            .setTitle(this.desc)
            .setTimestamp();
        return embed;
    }
}