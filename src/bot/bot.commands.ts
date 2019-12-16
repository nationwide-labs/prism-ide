import * as path from 'path';
import * as vscode from 'vscode';
import { Util } from '../util';
import * as fs from 'fs-extra';
import { PrismIntentService } from '../intent/intent.service';
import { PrismBotService } from './bot.service';
import { PrismBot } from './bot';
import { PrismBotItem, PrismBotItemUndeclared, PrismBotGenericItem } from './bot.provider';

export class PrismBotCommands {
    static setup() {
        vscode.commands.registerCommand('bot.setup', (item: PrismBotItemUndeclared) => {
            this.setupPrismBot(item);
        });

        vscode.commands.registerCommand('bot.open', (item: PrismBotItem) => {
            Util.openBot(item.bot);
        });

        vscode.commands.registerCommand('bot.speakSlow.toggle', (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            item.bot.speakSlow = !item.bot.speakSlow;
            item.bot.save();
        });

        vscode.commands.registerCommand('bot.main.toggle', (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            item.bot.isMainEnabled = !item.bot.isMainEnabled;
            item.bot.save();
        });

        vscode.commands.registerCommand('bot.main.code', (bot: PrismBot) => {
            if (!bot) { return; }
            let file = path.join(bot.folder, 'main.js');
            if (!fs.existsSync(file)) {
                Util.saveFile(file, '');
            }
            vscode.workspace.openTextDocument(file).then((doc) => {
                vscode.window.showTextDocument(doc);
            });
        });

        vscode.commands.registerCommand('bot.interceptor.toggle', (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            item.bot.isInterceptorEnabled = !item.bot.isInterceptorEnabled;
            item.bot.save();
        });

        vscode.commands.registerCommand('bot.interceptor.code', (bot: PrismBot) => {
            if (!bot) { return; }
            let file = path.join(bot.folder, 'interceptor.js');
            if (!fs.existsSync(file)) {
                Util.saveFile(file, '');
            }
            vscode.workspace.openTextDocument(file).then((doc) => {
                vscode.window.showTextDocument(doc);
            });
        });

        vscode.commands.registerCommand('bot.intents.toggle', (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            item.bot.isIntentsEnabled = !item.bot.isIntentsEnabled;
            item.bot.save();
        });

        vscode.commands.registerCommand('bot.intent.default', async (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            let response = await this.chooseIntent(item.bot).catch(() => { });
            if (response) {
                item.bot.defaultIntentId = response.intent ? response.intent.id : undefined;
                item.bot.save();
            }
        });

        vscode.commands.registerCommand('bot.intent.trigger', async (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            let response = await this.chooseIntent(item.bot).catch(() => { });
            if (response) {
                item.bot.triggerOnJoinIntentId = response.intent ? response.intent.id : undefined;
                item.bot.save();
            }
        });

        vscode.commands.registerCommand('bot.utterances.toggle', (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            item.bot.isUtterancesEnabled = !item.bot.isUtterancesEnabled;
            item.bot.save();
        });

        vscode.commands.registerCommand('bot.commands.toggle', (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            item.bot.isCommandsEnabled = !item.bot.isCommandsEnabled;
            item.bot.save();
        });

        vscode.commands.registerCommand('bot.commandPrefix', async (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            let value = await vscode.window.showInputBox({ placeHolder: 'Command Prefix', value: item.bot.commandPrefix });
            if (value !== undefined) {
                item.bot.commandPrefix = value;
                item.bot.save();
            }
        });

        vscode.commands.registerCommand('bot.commandHelp.toggle', (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            item.bot.isCommandsHelpEnabled = !item.bot.isCommandsHelpEnabled;
            item.bot.save();
        });

        vscode.commands.registerCommand('bot.tasks.toggle', (item: PrismBotGenericItem) => {
            if (!(item && item.bot)) { return; }
            item.bot.isTasksEnabled = !item.bot.isTasksEnabled;
            item.bot.save();
        });

        vscode.commands.registerCommand('bot.refresh', () => {
            PrismBotService.instance().reload();
        });
    }

    static async setupPrismBot(item: PrismBotItemUndeclared) {
        if (!(item)) { return; }

        if (!item.folder) {
            return vscode.window.showErrorMessage('No folder selected.');
        }

        let folder = path.join(item.folder, 'prism-bot');
        if (fs.existsSync(path.join(folder, 'data.json'))) {
            return vscode.window.showErrorMessage('The bot is already setup.');
        }

        let confirm = await vscode.window.showInformationMessage(`Are you sure you want to setup a prism bot?`, { modal: true }, 'Setup');
        if (!confirm) { return; }

        Util.ensurePath(folder);

        let bot = PrismBot.create();
        bot.folder = folder;
        bot.save();
        vscode.window.showInformationMessage('The bot has been setup!');
    }

    static async chooseIntent(bot: PrismBot) {
        let intents = PrismIntentService.instance().list(bot);
        let choices: any[] = [];

        choices.push({
            label: 'None'
        });

        for (let i = 0; i < intents.length; i++) {
            choices.push({
                label: intents[i].name,
                intent: intents[i]
            });
        }
        const value = await vscode.window.showQuickPick(choices, {
            placeHolder: 'Which intent?'
        });

        return value;
    }
}
