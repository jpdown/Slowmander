import r from "rethinkdb";
import { PantherBot } from "../Bot";
import { Config } from "./Credentials";
import { LogLevel } from "../Logger";

export class DatabaseManager {
    private _connection: r.Connection;
    private bot: PantherBot;
    private creds: RethinkCredentials

    constructor(bot: PantherBot, rethinkCreds: RethinkCredentials) {
        this.bot = bot;
        this.creds = rethinkCreds
    }

    public async connect() {
        try {
            this._connection = await r.connect({host: this.creds.rethinkHost, port: this.creds.rethinkPort,
                user: this.creds.rethinkUser, password: this.creds.rethinkPass, db: this.creds.rethinkDb});

            let dbList: string[] = await r.dbList().run(this._connection);
            if(!dbList.includes(this.creds.rethinkDb)) {
                await r.dbCreate(this.creds.rethinkDb).run(this._connection);
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

    public get db(): string {
        return(this.creds.rethinkDb);
    }
}

export interface RethinkCredentials {
    rethinkHost: string,
    rethinkPort: number,
    rethinkUser: string,
    rethinkPass: string,
    rethinkDb: string
}
