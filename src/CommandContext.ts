import type { Bot } from 'Bot';
import type {
  Client, CommandInteraction, Guild, GuildMember, InteractionReplyOptions, MessageOptions, TextBasedChannels, User,
} from 'discord.js';
import { Message } from 'discord.js';

export class CommandContext {
  public readonly bot: Bot;

  public readonly client: Client<true>;

  public readonly message?: Message;

  public readonly interaction?: CommandInteraction;

  public readonly channel: TextBasedChannels;

  public readonly user: User;

  public readonly guild?: Guild;

  public readonly member?: GuildMember;

  private _replyMessage?: Message;

  private _interactionReplied = false;

  constructor(
    bot: Bot, client: Client<true>, msgOrInteraction: Message | CommandInteraction,
    user: User, channel: TextBasedChannels, guild?: Guild, member?: GuildMember,
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
  }

  public async reply(message: string | MessageOptions | InteractionReplyOptions, ephemeral = false): Promise<void> {
    let msgOptions: MessageOptions | InteractionReplyOptions;

    if (typeof message === 'string') {
      msgOptions = { content: message };
    } else {
      msgOptions = message;
    }

    if (this.interaction) {
      (msgOptions as InteractionReplyOptions).ephemeral = ephemeral;
      if (!this._interactionReplied) {
        await this.interaction.reply(msgOptions);
        this._interactionReplied = true;
      }
      else {
        await this.interaction.followUp(msgOptions);
      }
    } else {
      if (msgOptions.allowedMentions) {
        msgOptions.allowedMentions.repliedUser = false;
      } else {
        msgOptions.allowedMentions = { repliedUser: false };
      }
      this._replyMessage = await this.message!.reply(msgOptions);
    }
  }

  public async replyPing(message: string | MessageOptions | InteractionReplyOptions, ephemeral = false) {
    let msgOptions: MessageOptions | InteractionReplyOptions;

    if (typeof message === 'string') {
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
    }
    else {
      await this.reply("Slowmander is thinking...");
    }
  }

  public async edit(message: string | MessageOptions | InteractionReplyOptions) {
    if (this.interaction && this._interactionReplied) {
      await this.interaction.editReply(message);
    }
    else if (this._replyMessage) {
      await this._replyMessage.edit(message);
    }
  }
}
