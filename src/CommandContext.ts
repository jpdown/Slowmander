import type { Bot } from "Bot";
import {
    Client,
    CommandInteraction,
    Guild,
    GuildMember,
    InteractionReplyOptions,
    MessageOptions,
    MessagePayload,
    TextBasedChannel,
    User,
} from "discord.js";
import { Message } from "discord.js";
import type { APIMessage } from "discord-api-types/v9";
import type { Command, CommandParsedType } from "commands/Command";
import { CommandUtils } from "utils/CommandUtils";

export class CommandContext<InGuild extends boolean = boolean> {
    public readonly bot: Bot;

    public readonly client: Client<true>;

    public readonly message?: Message;

    public readonly interaction?: CommandInteraction;

    public readonly channel: TextBasedChannel;

    public readonly user: User;

    public readonly command: Command;

    public readonly guild: InGuild extends true ? Guild : Guild | undefined;

    public readonly member: InGuild extends true ? GuildMember : GuildMember | undefined;

    public readonly args?: CommandParsedType[];

    private _replyMessage?: Message;

    private _deferred = false;

    private _replied = false;

    constructor(
        bot: Bot,
        client: Client<true>,
        msgOrInteraction: Message | CommandInteraction,
        user: User,
        channel: TextBasedChannel,
        command: Command,
        guild: InGuild extends true ? Guild : Guild | undefined,
        member: InGuild extends true ? GuildMember : GuildMember | undefined,
        args?: CommandParsedType[]
    ) {
        this.bot = bot;
        this.client = client;
        if (msgOrInteraction instanceof Message) {
            this.message = msgOrInteraction as Message;
            this.interaction = undefined;
        } else {
            this.interaction = msgOrInteraction as CommandInteraction;
            this.message = undefined;
        }
        this.channel = channel;
        this.user = user;
        this.guild = guild;
        this.member = member;
        this.args = args;
        this.command = command;
    }

    public async reply(
        message: string | MessageOptions | InteractionReplyOptions,
        ephemeral = false
    ): Promise<Message | APIMessage | undefined> {
        let msgOptions: MessageOptions | InteractionReplyOptions;
        let msg: Message | APIMessage | undefined = undefined;

        if (typeof message === "string") {
            msgOptions = { embeds: [await CommandUtils.generateEmbed(message, this.channel, true)] };
        } else {
            msgOptions = message;
        }

        if (this.interaction) {
            let intOptions = msgOptions as InteractionReplyOptions;
            intOptions.ephemeral = ephemeral;
            intOptions.fetchReply = true;
            if (!this.interaction.replied && !this.interaction.deferred) {
                await this.interaction.reply(intOptions);
                msg = await this.interaction.fetchReply();
            } else {
                msg = await this.interaction.followUp(intOptions);
            }
        } else {
            let payload: MessagePayload;
            if (!this._replyMessage) {
                payload = new MessagePayload(this.message!, msgOptions as MessageOptions);
                this._replyMessage = await this.message!.reply(payload);
                msg = this._replyMessage;
            } else if (this._deferred) {
                payload = new MessagePayload(this._replyMessage, msgOptions as MessageOptions);
                msg = await this._replyMessage.edit(payload);
            } else {
                // Reply to the first sent reply
                payload = new MessagePayload(this._replyMessage, msgOptions as MessageOptions);
                msg = await this._replyMessage.reply(payload);
            }
        }

        this._deferred = false;
        this._replied = true;

        return msg;
    }

    public async defer() {
        if (this.interaction) {
            await this.interaction.deferReply();
        } else {
            this._replyMessage = await this.message!.reply({
                embeds: [await CommandUtils.generateEmbed("Slowmander is thinking...", this.channel, true)],
            });
        }
        this._deferred = true;
    }

    public async edit(message: string | MessageOptions | InteractionReplyOptions) {
        let options: MessageOptions;
        let payload: MessagePayload;

        if (this.interaction && this.interaction.replied) {
            await this.interaction.editReply(message);
        } else if (this._replyMessage) {
            if (typeof message === 'string') {
                options = { embeds: [await CommandUtils.generateEmbed(message, this.channel, true)]}
            }
            else {
                options = message as MessageOptions;
            }
            payload = new MessagePayload(this._replyMessage, options);
            await this._replyMessage.edit(payload);
        }
    }

    public get replied(): boolean {
        return (this.interaction && this.interaction.replied) || this._replied;
    }
}
