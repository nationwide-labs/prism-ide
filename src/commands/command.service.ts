import { Util } from '../util';
import * as path from 'path';
import * as fs from 'fs-extra';
import { PrismCommand } from './command';
import { PrismCommandCommands } from './command.commands';
import { PrismBot } from '../bot/bot';

let varInstance: CommandService;

export class CommandService {
    static instance(): CommandService {
        if (!varInstance) {
            varInstance = new CommandService();
            PrismCommandCommands.setup();
        }
        return varInstance;
    }

    // private commands: PrismCommand[] = [];
    reloadCurrent() {
        Util.commandsChanged.next(this.list(Util.currentBot));
    }
    // reload(bot: PrismBot) {
    //     let items: PrismCommand[] = [];

    //     try {
    //         let commandsFolder = path.join(bot.folder, 'commands');
    //         let files = fs.readdirSync(commandsFolder);
    //         for (let i = 0; i < files.length; i++) {
    //             try {
    //                 let folder = path.join(commandsFolder, files[i]);
    //                 let data = Util.readJSON(path.join(folder, 'data.json'));
    //                 let command = new PrismCommand();
    //                 Object.assign(command, data);
    //                 command.normalize();
    //                 command.folder = folder;
    //                 items.push(command);
    //             } catch (err) { }
    //         }
    //     } catch (err) { }

    //     items.sort((a, b) => {
    //         return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    //     });

    //     this.commands = items;
    //     Util.commandsChanged.next(items);
    // }

    list(bot: PrismBot | undefined): PrismCommand[] {
        let items: PrismCommand[] = [];

        if (bot) {
            try {
                let commandsFolder = path.join(bot.folder, 'commands');
                let files = fs.readdirSync(commandsFolder);
                for (let i = 0; i < files.length; i++) {
                    try {
                        let folder = path.join(commandsFolder, files[i]);
                        let data = Util.readJSON(path.join(folder, 'data.json'));
                        let command = new PrismCommand();
                        Object.assign(command, data);
                        command.normalize();
                        command.folder = folder;
                        items.push(command);
                    } catch (err) { }
                }
            } catch (err) { }
        }

        items.sort((a, b) => {
            return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });

        return items;
    }
}
