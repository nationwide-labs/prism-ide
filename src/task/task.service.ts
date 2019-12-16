import { Util } from '../util';
import * as path from 'path';
import * as fs from 'fs-extra';
import { PrismTask } from './task';
import { PrismTaskCommands } from './task.commands';
import { PrismBot } from '../bot/bot';

let varInstance: PrismTaskService;

export class PrismTaskService {
    static instance(): PrismTaskService {
        if (!varInstance) {
            varInstance = new PrismTaskService();
            PrismTaskCommands.setup();
        }
        return varInstance;
    }

    reloadCurrent() {
        Util.tasksChanged.next(this.list(Util.currentBot));
    }

    list(bot: PrismBot | undefined): PrismTask[] {
        let items: PrismTask[] = [];

        if (bot) {
            try {
                let tasksFolder = path.join(bot.folder, 'tasks');
                let files = fs.readdirSync(tasksFolder);
                for (let i = 0; i < files.length; i++) {
                    try {
                        let folder = path.join(tasksFolder, files[i]);
                        let data = Util.readJSON(path.join(folder, 'data.json'));
                        let task = new PrismTask();
                        Object.assign(task, data);
                        task.folder = folder;
                        items.push(task);
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
