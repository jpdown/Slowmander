import { Bot } from "Bot";
import { Logger } from "Logger";

import r from "rethinkdb";

export class DatabaseManager {
    private bot: Bot;
    private logger: Logger;

    constructor(bot: Bot, rethinkCreds: RethinkCredentials) {
        this.bot = bot;
        this.logger = Logger.getLogger(bot, this);
        this.creds = rethinkCreds
    }

    public async connect() {
        try {
            let rethinkOptions: r.ConnectionOptions = {host: this.creds.rethinkHost, port: this.creds.rethinkPort,
                user: this.creds.rethinkUser, password: this.creds.rethinkPass, db: this.creds.rethinkDb};
            if(this.creds.rethinkCert !== "") {
                rethinkOptions.ssl = {
                    "ca": this.creds.rethinkCert
                }
            }
            this._connection = await r.connect(rethinkOptions);

            let dbList: string[] = await r.dbList().run(this._connection);
            if(!dbList.includes(this.creds.rethinkDb)) {
                await r.dbCreate(this.creds.rethinkDb).run(this._connection);
            }
        }
        catch(err) {
            await this.logger.error("Error connecting to rethinkdb", err);
            this._connection = undefined;
        }
        
    }

    public async getConnection(): Promise<r.Connection | undefined> {
        if(!this._connection) {
            await this.connect();
        }
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
    rethinkDb: string,
    rethinkCert: string
}
