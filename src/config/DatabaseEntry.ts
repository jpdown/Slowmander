import { Bot } from 'Bot';
import { Logger } from 'Logger';

import r from 'rethinkdb';

export abstract class DatabaseEntry<T extends DatabaseObject> {
  protected readonly TABLE: string;

  protected bot: Bot;

  protected logger: Logger;

  protected defaultEntry: DatabaseObject | undefined;

  constructor(table: string, defaultEntry: DatabaseObject | undefined, bot: Bot) {
    this.TABLE = table;
    this.defaultEntry = defaultEntry;
    this.bot = bot;
    this.logger = Logger.getLogger(bot, this);
  }

  protected async checkTable(): Promise<boolean> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return false;
    }
    // If we need to generate the table, do so
    let tableList: string[];
    try {
      tableList = await r.db(this.bot.databaseManager.db).tableList().run(connection);
    } catch (err) {
      await this.logger.error('Error getting table list.', err);
      return false;
    }

    if (!tableList.includes(this.TABLE)) {
      return this.generateTable();
    }

    // We have the table if we get here
    return true;
  }

  protected async checkDocument(id: string): Promise<boolean> {
    return await this.getDocument(id) !== null;
  }

  protected async getDocument(id: string): Promise<T | undefined> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return undefined;
    }
    if (!await this.checkTable()) return undefined;

    let dbObj: T | undefined;

    try {
      dbObj = <T> await r.table(this.TABLE).get(id).run(connection);
    } catch (err) {
      await this.logger.error('Error getting from database.', err);
    }

    return dbObj;
  }

  protected async getFirstDocument(): Promise<T | undefined> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return undefined;
    }
    if (!await this.checkTable()) return undefined;

    let dbObj: T | undefined;

    try {
      const result: r.Cursor = await r.table(this.TABLE).limit(1).run(connection);
      const resultArray: T[] = await result.toArray();
      if (resultArray.length > 0) dbObj = resultArray[0];
    } catch (err) {
      await this.logger.error('Error getting from database.', err);
    }

    return dbObj;
  }

  protected async getAllDocuments(): Promise<T[] | undefined> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return undefined;
    }
    if (!await this.checkTable()) return undefined;

    let resultArray: T[] | undefined;

    try {
      const result: r.Cursor = await r.table(this.TABLE).run(connection);
      resultArray = await result.toArray();
      if (resultArray.length === 0) {
        resultArray = undefined;
      }
    } catch (err) {
      await this.logger.error('Error getting from database.', err);
    }

    return resultArray;
  }

  protected async updateDocument(id: any, object: T): Promise<boolean> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return false;
    }
    if (!await this.checkTable()) return false;

    try {
      const result: r.WriteResult = await r.table(this.TABLE).get(id).update(object).run(connection);
      if (result.errors > 0) {
        await this.logger.error(`Error updating document. Table: ${this.TABLE}, ID: ${id}, Updates: ${object}. First error: ${result.first_error}`);
        return false;
      }

      return true;
    } catch (err) {
      await this.logger.error(`Error updating document. Table: ${this.TABLE}, ID: ${id}, Updates: ${object}`, err);
      return false;
    }
  }

  protected async updateFirstDocument(object: T): Promise<boolean> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return false;
    }
    if (!await this.checkTable()) return false;

    try {
      const result: r.WriteResult = await r.table(this.TABLE).limit(1).update(object).run(connection);
      if (result.errors > 0) {
        await this.logger.error(`Error updating document. Table: ${this.TABLE}, Updates: ${object}. First error: ${result.first_error}`);
        return false;
      }

      return true;
    } catch (err) {
      await this.logger.error(`Error updating document. Table: ${this.TABLE}, Updates: ${object}`, err);
      return false;
    }
  }

  protected async insertDocument(object: T, id?: any): Promise<boolean> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return false;
    }
    if (!await this.checkTable()) return false;

    try {
      if (id) {
        object.id = id;
      }
      const result: r.WriteResult = await r.table(this.TABLE).insert(object).run(connection);
      if (result.errors > 0) {
        await this.logger.error(`Error inserting document. Table: ${this.TABLE}, ID: ${id}, Document: ${object}. First error: ${result.first_error}`);
        return false;
      }

      return true;
    } catch (err) {
      await this.logger.error(`Error inserting document. Table: ${this.TABLE}, ID: ${id}, Document: ${object}`, err);
      return false;
    }
  }

  protected async updateOrInsertDocument(id: any, object: T): Promise<boolean> {
    if (await this.checkDocument(id)) {
      return this.updateDocument(id, object);
    }

    return this.insertDocument(object, id);
  }

  protected async removeMatchingDocuments(object: T): Promise<boolean> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return false;
    }
    if (!await this.checkTable()) return false;

    try {
      const result: r.WriteResult = await r.table(this.TABLE).filter(object).delete().run(connection);
      if (result.errors > 0) {
        await this.logger.error(`Error removing documents. Table: ${this.TABLE}, Filter: ${object}. First error: ${result.first_error}`);
        return false;
      }

      return true;
    } catch (err) {
      await this.logger.error(`Error removing documents. Table: ${this.TABLE}, Filter: ${object}.`, err);
      return false;
    }
  }

  protected async getAllMatches(row: string, value: string): Promise<T[] | undefined> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return undefined;
    }
    let resultsArr: T[] | undefined;

    if (!await this.checkTable()) return resultsArr;

    try {
      const cursor: r.Cursor = await r.table(this.TABLE).filter(r.row(row).eq(value)).run(connection);
      resultsArr = await cursor.toArray();
    } catch (err) {
      await this.logger.error(`Error getting matching documents. Table: ${this.TABLE}, Row: ${row}, Value: ${value}`, err);
      return undefined;
    }

    return resultsArr;
  }

  private async generateTable(): Promise<boolean> {
    const connection: r.Connection | undefined = await this.bot.databaseManager.getConnection();
    if (!connection) {
      await this.logger.error('Error getting database connection.');
      return false;
    }
    try {
      await r.db(this.bot.databaseManager.db).tableCreate(this.TABLE).run(connection);
      await this.logger.info(`Table ${this.TABLE} created successfully.`);

      if (this.defaultEntry) {
        await r.table(this.TABLE).insert(this.defaultEntry).run(connection);
        await this.logger.info(`Default data put in ${this.TABLE} successfully.`);
      }

      return true;
    } catch (err) {
      await this.logger.error('Error creating table.', err);
      return false;
    }
  }
}

export interface DatabaseObject {
  id?: any;
}
