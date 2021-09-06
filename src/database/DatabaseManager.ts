import BS3 from 'better-sqlite3';

import Bot from 'Bot';
import { Logger } from 'Logger';
import GuildConfigs from './GuildConfigs';
import LockdownPresets from './LockdownPresets';
import ReactionRoles from './ReactionRoles';
import TwitchClipModeration from './TwitchClipModeration';
import Verification from './Verification';

export default class DatabaseManager {
  readonly DB_PATH: string = './data/slowmander.db';

  private readonly logger: Logger;

  private readonly db: BS3.Database;

  public readonly guildConfigs: GuildConfigs;
  public readonly lockdownPresets: LockdownPresets;
  public readonly reactionRoles: ReactionRoles;
  public readonly twitchClipMod: TwitchClipModeration;
  public readonly verification: Verification;

  constructor(bot: Bot) {
    this.logger = Logger.getLogger(bot, this);
    this.db = new BS3(this.DB_PATH);

    this.db.pragma('foreign_keys = ON');

    this.guildConfigs = new GuildConfigs(bot, this.db);
    this.lockdownPresets = new LockdownPresets(bot, this.db);
    this.reactionRoles = new ReactionRoles(bot, this.db);
    this.twitchClipMod = new TwitchClipModeration(bot, this.db);
    this.verification = new Verification(bot, this.db);
  }
}
