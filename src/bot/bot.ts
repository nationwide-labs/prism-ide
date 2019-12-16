import { Util } from '../util';
import * as path from 'path';
import { PrismBotService } from './bot.service';

export class PrismBot {
    defaultIntentId!: string;
    triggerOnJoinIntentId!: string;
    speakSlow!: boolean;
    isCommandsEnabled!: boolean;
    isCommandsHelpEnabled!: boolean;
    isUtterancesEnabled!: boolean;
    isInterceptorEnabled!: boolean;
    commandPrefix!: string;
    isMainEnabled!: boolean;
    isTasksEnabled!: boolean;
    isIntentsEnabled!: boolean;

    folder!: string;

    save() {
        if (!this.folder) { return; }

        Util.ensurePath(this.folder);

        Util.saveJSON(path.join(this.folder, 'data.json'), {
            speakSlow: this.speakSlow,
            isMainEnabled: this.isMainEnabled,
            isInterceptorEnabled: this.isInterceptorEnabled,
            isIntentsEnabled: this.isIntentsEnabled,
            defaultIntentId: this.defaultIntentId,
            triggerOnJoinIntentId: this.triggerOnJoinIntentId,
            isUtterancesEnabled: this.isUtterancesEnabled,
            isCommandsEnabled: this.isCommandsEnabled,
            isCommandsHelpEnabled: this.isCommandsHelpEnabled,
            commandPrefix: this.commandPrefix,
            isTasksEnabled: this.isTasksEnabled
        });

        PrismBotService.instance().reload();
    }

    // tslint:disable-next-line: member-ordering
    static create(): PrismBot {
        let bot = new PrismBot();
        bot.speakSlow = true;
        bot.isCommandsEnabled = true;
        bot.isCommandsHelpEnabled = true;
        bot.isUtterancesEnabled = true;
        bot.isInterceptorEnabled = false;
        bot.commandPrefix = '!';
        bot.isMainEnabled = false;
        bot.isTasksEnabled = true;
        bot.isIntentsEnabled = true;
        return bot;
    }
}
