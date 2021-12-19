import type { Bot } from "Bot";
import type {
    Client,
    CommandInteraction,
    Guild,
    GuildMember,
    InteractionReplyOptions,
    MessageOptions,
    TextBasedChannels,
    User,
} from "discord.js";
import { Message } from "discord.js";
import type { APIMessage } from "discord-api-types/v9";
import type { CommandParsedType } from "commands/Command";

export class CommandContext {
    public readonly bot: Bot;

    public readonly client: Client<true>;

    public readonly message?: Message;

    public readonly interaction?: CommandInteraction;

    public readonly channel: TextBasedChannels;

    public readonly user: User;

    public readonly guild?: Guild;

    public readonly member?: GuildMember;

    public readonly args?: CommandParsedType[];

    private _replyMessage?: Message;

    private _interactionReplied = false;

    private _deferred = false;

    constructor(
        bot: Bot,
        client: Client<true>,
        msgOrInteraction: Message | CommandInteraction,
        user: User,
        channel: TextBasedChannels,
        guild?: Guild,
        member?: GuildMember,
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
    }

    public async reply(
        message: string | MessageOptions | InteractionReplyOptions,
        ephemeral = false
    ): Promise<Message | APIMessage | undefined> {
        let msgOptions: MessageOptions | InteractionReplyOptions;
        let msg: Message | APIMessage | undefined = undefined;

        if (typeof message === "string") {
            msgOptions = { content: message };
        } else {
            msgOptions = message;
        }

        if (this.interaction) {
            let intOptions = msgOptions as InteractionReplyOptions;
            intOptions.ephemeral = ephemeral;
            intOptions.fetchReply = true;
            if (!this._interactionReplied) {
                await this.interaction.reply(intOptions);
                msg = await this.interaction.fetchReply();
                this._interactionReplied = true;
            } else {
                msg = await this.interaction.followUp(intOptions);
            }
        } else {
            if (msgOptions.allowedMentions) {
                msgOptions.allowedMentions.repliedUser = false;
            } else {
                msgOptions.allowedMentions = { repliedUser: false };
            }
            if (!this._replyMessage) {
                this._replyMessage = await this.message!.reply(msgOptions);
                msg = this._replyMessage;
            } else if (this._deferred) {
                msg = await this._replyMessage.edit(msgOptions);
            } else {
                // Reply to the first sent reply
                msg = await this._replyMessage.reply(msgOptions);
            }
        }

        this._deferred = false;

        return msg;
    }

    public async replyPing(
        message: string | MessageOptions | InteractionReplyOptions,
        ephemeral = false
    ) {
        let msgOptions: MessageOptions | InteractionReplyOptions;

        if (typeof message === "string") {
            msgOptions = { content: message };
        } else {
            msgOptions = message;
        }

        if (this.interaction) {
            (msgOptions as InteractionReplyOptions).ephemeral = ephemeral;
            await this.interaction.reply(msgOptions);
        } else {
            if (msgOptions.allowedMentions) {
                msgOptions.allowedMentions.repliedUser = true;
            } else {
                msgOptions.allowedMentions = { repliedUser: true };
            }
            this._replyMessage = await this.message!.reply(msgOptions);
        }
    }

    public async defer() {
        if (this.interaction) {
            await this.interaction.deferReply();
            this._interactionReplied = true;
        } else {
            this._replyMessage = await this.message!.reply(
                "Slowmander is thinking..."
            );
        }
        this._deferred = true;
    }

    public async edit(
        message: string | MessageOptions | InteractionReplyOptions
    ) {
        if (this.interaction && this._interactionReplied) {
            await this.interaction.editReply(message);
        } else if (this._replyMessage) {
            await this._replyMessage.edit(message);
        }
    }
}
