import * as fs from 'fs';

export class Config {
    readonly CONFIG_PATH: string = "./data/config.json";

    private configObject: ConfigObjectJSON;

    constructor() {
        this.configObject = null;
        this.loadConfig();
    }

    public loadConfig() {
        let jsonData: string = fs.readFileSync(this.CONFIG_PATH).toString();
        try {
            this.configObject = <ConfigObjectJSON>JSON.parse(jsonData);
        }
        catch(err) {
            this.configObject = null;
        }

        if(this.configObject == null) {
            this.generateConfig();
        }
    }
    
    public saveConfig() {
        if(!fs.existsSync("data"))
            fs.mkdirSync("data");
        let jsonData: string = JSON.stringify(this.configObject);
        fs.writeFileSync(this.CONFIG_PATH, jsonData);
    }

    public getToken(): string {
        return(this.configObject.token);
    }

    public async getOwner(): Promise<string> {
        return(this.configObject.owner);
    }

    public async setOwner(newOwner: string) {
        this.configObject.owner = newOwner;

        this.saveConfig();
    }

    public async getPrefix(): Promise<string> {
        return(this.configObject.prefix);
    }

    public async setPrefix(newPrefix: string) {
        this.configObject.prefix = newPrefix;

        this.saveConfig();
    }

    private generateConfig() {
        this.configObject = {
            owner: "",
            token: "",
            prefix: "!"
        };

        this.saveConfig();

        console.log("Default config generated.");
    }
}

interface ConfigObjectJSON {
    owner: string,
    token: string,
    prefix: string
}
