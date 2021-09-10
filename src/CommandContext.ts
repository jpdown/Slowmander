import type { Bot } from 'Bot';
import type {
  Client, CommandInteraction, Guild, GuildMember, InteractionReplyOptions, Message, MessageOptions, TextBasedChannels, User,
} from 'discord.js';

export class CommandContext {
  public readonly bot: Bot;

  public readonly client: Client<true>;

  public readonly message?: Message;

  public readonly interaction?: CommandInteraction;

  public readonly channel: TextBasedChannels;

  public readonly user: User;

  public readonly guild?: Guild;

  public readonly member?: GuildMember;

  constructor(
    bot: Bot, client: Client<true>, msgOrInteraction: Message | CommandInteraction,
    channel: TextBasedChannels, user: User, guild?: Guild, member?: GuildMember,
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

  public async reply(message: string | MessageOptions, ephemeral = false, fetchReply = false) {
    if (this.interaction) {
      let msgOptions: InteractionReplyOptions;
      if (message as InteractionReplyOptions) {
        msgOptions = message as InteractionReplyOptions;
      } else {
        msgOptions = { content: message as string };
      }
      msgOptions.ephemeral = ephemeral;
      msgOptions.fetchReply = fetchReply;
      await this.interaction.reply(msgOptions);
    } else {
      this.message!.reply(message);
    }
  }
}
