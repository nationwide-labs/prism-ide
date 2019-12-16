import * as vscode from 'vscode';
import * as path from 'path';
import { Util } from '../util';
import { PrismBot } from './bot';
import * as fs from 'fs-extra';
import { PrismBotCommands } from './bot.commands';

let varInstance: PrismBotService;

export class PrismBotService {

    static instance(): PrismBotService {
        if (!varInstance) {
            varInstance = new PrismBotService();
            PrismBotCommands.setup();
        }
        return varInstance;
    }

    private bots: PrismBot[] = [];

    list(): PrismBot[] {
        return this.bots;
    }

    create() {
        let bot = new PrismBot();
        bot.speakSlow = true;
        bot.isIntentsEnabled = true;
        bot.isCommandsEnabled = true;
        bot.isCommandsHelpEnabled = true;
        bot.isUtterancesEnabled = true;
        bot.isTasksEnabled = true;
        bot.isInterceptorEnabled = false;
        bot.isMainEnabled = false;
        bot.commandPrefix = '!';
        bot.save();
    }

    reload() {
        let bot: PrismBot | undefined;

        let bots = [];
        let folders = vscode.workspace.workspaceFolders || [];
        try {
            for (let i = 0; i < folders.length; i++) {
                let folder = path.join(folders[i].uri.fsPath, 'prism-bot');
                if (fs.existsSync(folder)) {
                    let data = Util.readJSON(path.join(folder, 'data.json'));
                    if (data) {
                        bot = new PrismBot();
                        Object.assign(bot, data);
                        bot.folder = folder;
                        bots.push(bot);
                    }
                }
            }
        } catch (err) { }
        this.bots = bots;
        Util.botsChanged.next(bots);
    }
}
