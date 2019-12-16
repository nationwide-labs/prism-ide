import * as path from 'path';
import * as fs from 'fs-extra';
import { Util } from '../util';
import { PrismIntent, PrismIntentTrigger, PrismIntentUtterance } from './intent';
import { v4 as uuid } from 'uuid';
import { PrismIntentCommands } from './intent.commands';
import { PrismBot } from '../bot/bot';

let varInstance: PrismIntentService;

export class PrismIntentService {
    static instance(): PrismIntentService {
        if (!varInstance) {
            varInstance = new PrismIntentService();
            PrismIntentCommands.setup();
        }
        return varInstance;
    }

    // private intents: PrismIntent[] = [];

    createTrigger(name: string): PrismIntentTrigger {
        let item = new PrismIntentTrigger();
        item.id = uuid();
        item.name = name;
        return item;
    }

    createUtterance(name: string): PrismIntentUtterance {
        let item = new PrismIntentUtterance();
        item.id = uuid();
        item.name = name;
        return item;
    }

    findById(bot: PrismBot, id: string): PrismIntent | undefined {
        let list = this.list(bot);
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                return list[i];
            }
        }
    }

    get(folder: string): PrismIntent {
        let data = Util.readJSON(path.join(folder, 'data.json'));
        let intent = new PrismIntent();

        Object.assign(intent, data);

        intent.normalize();

        intent.folder = folder;
        return intent;
    }

    list(bot: PrismBot | undefined): PrismIntent[] {
        let intents: PrismIntent[] = [];

        if (bot) {
            try {
                let intentsFolder = path.join(bot.folder, 'intents');
                let intentNames = fs.readdirSync(intentsFolder);
                for (let i = 0; i < intentNames.length; i++) {
                    try {
                        let intentFolder = path.join(intentsFolder, intentNames[i]);
                        let intent = this.get(intentFolder);
                        intents.push(intent);
                    } catch (err) { }
                }
            } catch (err) { }
        }

        intents.sort((a, b) => {
            return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });

        return intents;
    }

    reloadCurrent() {
        Util.intentsChanged.next(this.list(Util.currentBot));
    }
}
