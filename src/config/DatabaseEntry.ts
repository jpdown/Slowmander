import { PantherBot } from "../Bot";
import { LogLevel } from "../Logger";

import r from "rethinkdb";

export abstract class DatabaseEntry<T extends DatabaseObject> {
    protected readonly TABLE: string;
    protected bot: PantherBot;
    protected defaultEntry: DatabaseObject;

    constructor(table: string, defaultEntry: DatabaseObject, bot: PantherBot) {
        this.TABLE = table;
        this.defaultEntry = defaultEntry;
        this.bot = bot;
    }

    protected async checkTable(): Promise<boolean> {
        //If we need to generate the table, do so
        let tableList: string[];
        try {
            tableList = await r.db(this.bot.databaseManager.db).tableList().run(await this.bot.databaseManager.getConnection());
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, "Error getting table list.", err);
            return(false);
        }

        if(!tableList.includes(this.TABLE)) {
            return(await this.generateTable());
        }

        //We have the table if we get here
        return(true);
    }

    protected async checkDocument(id: string): Promise<boolean> {
        return(await this.getDocument(id) !== undefined);
    }

    protected async getDocument(id: string): Promise<T> {
        if(!await this.checkTable()) return(undefined);

        let dbObj: T = undefined;

        try {
            dbObj = <T> await r.table(this.TABLE).get(id).run(await this.bot.databaseManager.getConnection());
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, `${this.constructor.name}:getDocument Error getting from database.`, err);
        }

        return(dbObj);
    }

    protected async getFirstDocument(): Promise<T> {
        if(!await this.checkTable()) return(undefined);

        let dbObj: T = undefined;

        try {
            let result: r.Cursor = await r.table(this.TABLE).limit(1).run(await this.bot.databaseManager.getConnection());
            let resultArray: T[] = await result.toArray();
            if(resultArray.length > 0) dbObj = resultArray[0];
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, `${this.constructor.name}:getFirstDocument Error getting from database.`, err);
        }

        return(dbObj);
    }

    protected async updateDocument(id: any, object: T): Promise<boolean> {
        if(!await this.checkTable()) return(false);

        try {
            let result: r.WriteResult = await r.table(this.TABLE).get(id).update(object).run(await this.bot.databaseManager.getConnection());
            if(result.errors > 0) {
                await this.bot.logger.log(LogLevel.ERROR, `${this.constructor.name}:updateDocument Error updating document. Table: ${this.TABLE}, ID: ${id}, Updates: ${object}. First error: ${result.first_error}`);
                return(false);
            }

            return(true);
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, `${this.constructor.name}:updateDocument Error updating document. Table: ${this.TABLE}, ID: ${id}, Updates: ${object}`, err);
            return(false)
        }
    }

    protected async updateFirstDocument(object: T): Promise<boolean> {
        if(!await this.checkTable()) return(false);

        try {
            let result: r.WriteResult = await r.table(this.TABLE).limit(1).update(object).run(await this.bot.databaseManager.getConnection());
            if(result.errors > 0) {
                await this.bot.logger.log(LogLevel.ERROR, `${this.constructor.name}:updateFirstDocument Error updating document. Table: ${this.TABLE}, Updates: ${object}. First error: ${result.first_error}`);
                return(false);
            }

            return(true);
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, `${this.constructor.name}:updateFirstDocument Error updating document. Table: ${this.TABLE}, Updates: ${object}`, err);
            return(false)
        }
    }

    protected async insertDocument(object: T, id?: any): Promise<boolean> {
        if(!await this.checkTable()) return(false);

        try {
            if(id) {
                object.id = id;
            }
            let result: r.WriteResult = await r.table(this.TABLE).insert(object).run(await this.bot.databaseManager.getConnection());
            if(result.errors > 0) {
                await this.bot.logger.log(LogLevel.ERROR, `${this.constructor.name}:insertDocument Error inserting document. Table: ${this.TABLE}, ID: ${id}, Document: ${object}. First error: ${result.first_error}`);
                return(false);
            }

            return(true);
        }
        catch(err) {
            await this.bot.logger.log(LogLevel.ERROR, `${this.constructor.name}:insertDocument Error inserting document. Table: ${this.TABLE}, ID: ${id}, Document: ${object}`, err);
            return(false)
        }
    }

    protected async updateOrInsertDocument(id: any, object: T): Promise<boolean> {
        if(await this.checkDocument(id)) {
            return(await this.updateDocument(id, object));
        }
        else {
            return(await this.insertDocument(object, id));
        }
    }

    private async generateTable(): Promise<boolean> {
        try {
            await r.db(this.bot.databaseManager.db).tableCreate(this.TABLE).run(await this.bot.databaseManager.getConnection())
            await this.bot.logger.log(LogLevel.INFO, `Table ${this.TABLE} created successfully.`);

            if(this.defaultEntry) {
                await r.table(this.TABLE).insert(this.defaultEntry).run(await this.bot.databaseManager.getConnection()) 
                await this.bot.logger.log(LogLevel.INFO, `Default data put in ${this.TABLE} successfully.`);
            }

            return(true);
        }
        catch(err) {
            this.bot.logger.logSync(LogLevel.ERROR, "BotConfig:generateTable Error creating table.", err);
            return(false);
        }
    }
}

export interface DatabaseObject {
    id?: any
}