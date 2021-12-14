import type { Bot } from 'Bot';
import type {
  Client, CommandInteraction, Guild, GuildMember, InteractionReplyOptions, Message, MessageOptions, TextBasedChannels, User,
} from 'discord.js';

export class CommandContext {
  public readonly bot: Bot;

  public readonly client: Client<true>;

  public readonly message?: Message;

  public readonly interaction?: CommandInteraction;

  public readonly channel?: TextBasedChannels;

  public readonly user: User;

  public readonly guild?: Guild;

  public readonly member?: GuildMember;

  private _replyMessage?: Message;

  constructor(
    bot: Bot, client: Client<true>, msgOrInteraction: Message | CommandInteraction,
    user: User, channel?: TextBasedChannels, guild?: Guild, member?: GuildMember,
  ) {
    this.bot = bot;
    this.client = client;
    if (msgOrInteraction as Message) {
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

  // todo implement followup and defer
  public async reply(message: string | MessageOptions | InteractionReplyOptions, ephemeral = false): Promise<void> {
    let msgOptions: MessageOptions | InteractionReplyOptions;

    if (typeof message === 'string') {
      msgOptions = { content: message };
    } else {
      msgOptions = message;
    }

    if (this.interaction) {
      (msgOptions as InteractionReplyOptions).ephemeral = ephemeral; // todo fix this not working lmao
      await this.interaction.reply(msgOptions);
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

  public get replyMessage(): Message | undefined {
    return this._replyMessage;
  }
}
