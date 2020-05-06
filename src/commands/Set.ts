import { CommandGroup } from "./CommandGroup";
import { Command } from "./Command";
import { PermissionLevel } from "./Command";
import { PantherBot } from "../Bot";

import { Message } from "discord.js";

export class Set extends CommandGroup {
    constructor() {
        super("set", PermissionLevel.Owner, "Sets various bot parameters", "", true);

        this.registerSubCommands();
    }

    protected registerSubCommands(): void {
        this.registerSubCommand(new SetUsername(this));
    }
}

class SetUsername extends Command {
    constructor(group: CommandGroup) {
        super("username", PermissionLevel.Owner, "Sets bot username", "<username>", true, group);
    }

    public async run(bot: PantherBot, message: Message, args: string[]): Promise<void> {
        let newUsername: string = args.join(" ");

        if(newUsername.length < 2) {
            await this.sendMessage("Username too short.", message.channel);
            return;
        }

        await message.client.user.setUsername(newUsername);
        await this.sendMessage("Username changed successfully.", message.channel);
    }
}