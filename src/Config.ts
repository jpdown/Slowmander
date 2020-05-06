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

    public async getAdminRole(): Promise<string> {
        return(this.configObject.adminRole);
    }

    public async setAdminRole(newAdminRole: string) {
        this.configObject.adminRole = newAdminRole;

        this.saveConfig();
    }

    public async getModRole(): Promise<string> {
        return(this.configObject.modRole);
    }

    public async setModRole(newModRole: string) {
        this.configObject.modRole = newModRole;

        this.saveConfig();
    }

    public async getVipRole(): Promise<string> {
        return(this.configObject.vipRole);
    }

    public async setVipRole(newVipRole: string) {
        this.configObject.vipRole = newVipRole;

        this.saveConfig();
    }

    private generateConfig() {
        this.configObject = {
            owner: "",
            token: "",
            prefix: "!",
            adminRole: "",
            modRole: "",
            vipRole: ""
        };

        this.saveConfig();

        console.log("Default config generated.");
    }
}

interface ConfigObjectJSON {
    owner: string,
    token: string,
    prefix: string,
    adminRole: string,
    modRole: string,
    vipRole: string
}
