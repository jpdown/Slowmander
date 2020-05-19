import r from "rethinkdb";
import { PantherBot } from "../Bot";
import { Config } from "./Credentials";
import { LogLevel } from "../Logger";

export class DatabaseManager {
    private _connection: r.Connection;
    private bot: PantherBot;

    constructor(bot: PantherBot) {
        this.bot = bot;
    }

    public async connect() {
        let config: Config = this.bot.credentials;

        try {
            this._connection = await r.connect({host: config.rethinkHost, port: config.rethinkPort,
                user: config.rethinkUser, password: config.rethinkPass, db: config.rethinkDb});

            let dbList: string[] = await r.dbList().run(this._connection);
            if(!dbList.includes(config.rethinkDb)) {
                await r.dbCreate(config.rethinkDb).run(this._connection);
            }
        }
        catch(err) {
            this.bot.logger.logSync(LogLevel.ERROR, "DatabaseManager:connect Error connecting to rethinkdb", err);
            this._connection = undefined;
        }
        
    }

    

    public get connection(): r.Connection {
        return(this._connection);
    }
}