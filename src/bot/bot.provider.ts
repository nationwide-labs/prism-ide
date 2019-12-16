import * as vscode from 'vscode';
import * as path from 'path';
import { Util } from '../util';
import { PrismBot } from './bot';
import * as fs from 'fs-extra';
import { PrismIntentService } from '../intent/intent.service';

export class BotsProvider implements vscode.TreeDataProvider<any> {
    // tslint:disable-next-line: variable-name
    private _onDidChangeTreeData: vscode.EventEmitter<any | undefined> = new vscode.EventEmitter<any | undefined>();
    // tslint:disable-next-line: member-ordering
    readonly onDidChangeTreeData: vscode.Event<any | undefined> = this._onDidChangeTreeData.event;
    constructor() {
        Util.botsChanged.subscribe({
            next: (bots: PrismBot[]) => {
                this.refresh();
            }
        });

        Util.botsChanged.subscribe({
            next: (bots: PrismBot[]) => {
                let bot: PrismBot | undefined;
                if (Util.currentBot) {
                    for (let i = 0; i < bots.length; i++) {
                        if (bots[i].folder === Util.currentBot.folder) {
                            bot = bots[i];
                        }
                    }
                }
                if (!bot && bots.length > 0) {
                    bot = bots[0];
                }
                Util.openBot(bot);
            }
        });

        Util.botChanged.subscribe({
            next: () => {
                this.refresh();
            }
        });
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }

    getParent(element?: any) {
        return null;
    }

    getChildren(element?: any): Thenable<any[]> {

        let items = [];
        let indicateNone = false;

        if (!element) {
            indicateNone = true;

            let folders = vscode.workspace.workspaceFolders || [];
            try {
                for (let i = 0; i < folders.length; i++) {
                    let bot: PrismBot | undefined;
                    let folder = path.join(folders[i].uri.fsPath, 'prism-bot');
                    if (fs.existsSync(folder)) {
                        let data = Util.readJSON(path.join(folder, 'data.json'));
                        if (data) {
                            bot = new PrismBot();
                            Object.assign(bot, data);
                            bot.folder = folder;
                        }
                    }
                    if (bot) {
                        items.push(new PrismBotItem(bot));
                    } else {
                        items.push(new PrismBotItemUndeclared(folders[i].uri.fsPath));
                    }
                }
            } catch (err) { }
        } else if (element.contextValue === 'bot') {
            let bot: PrismBot = element.bot;

            let defaultIntent;
            let triggerIntent;

            if (bot.defaultIntentId) {
                defaultIntent = PrismIntentService.instance().findById(bot, bot.defaultIntentId);
            }

            if (bot.triggerOnJoinIntentId) {
                triggerIntent = PrismIntentService.instance().findById(bot, bot.triggerOnJoinIntentId);
            }

            let mainItem = new PrismBotGenericItem(bot, 'Main', bot.isMainEnabled ? 'Enabled' : 'Disabled', 'bot.main');

            mainItem.command = {
                command: 'bot.main.code',
                title: '',
                arguments: [bot]
            };

            let interceptorItem = new PrismBotGenericItem(bot, 'Interceptor', bot.isInterceptorEnabled ? 'Enabled' : 'Disabled', 'bot.interceptor');
            interceptorItem.command = {
                command: 'bot.interceptor.code',
                title: '',
                arguments: [bot]
            };

            items.push(new PrismBotGenericItem(bot, 'Speak Slow', bot.speakSlow ? 'Enabled' : 'Disabled', 'bot.speakSlow'));
            items.push(mainItem);
            items.push(interceptorItem);
            items.push(new PrismBotGenericItem(bot, 'Intents', bot.isIntentsEnabled ? 'Enabled' : 'Disabled', 'bot.intents'));
            items.push(new PrismBotGenericItem(bot, 'Default Intent', defaultIntent ? defaultIntent.name : 'Not Set', 'bot.defaultIntent'));
            items.push(new PrismBotGenericItem(bot, 'Trigger Intent', triggerIntent ? triggerIntent.name : 'Not Set', 'bot.triggerIntent'));
            items.push(new PrismBotGenericItem(bot, 'Utterances', bot.isUtterancesEnabled ? 'Enabled' : 'Disabled', 'bot.utterances'));
            items.push(new PrismBotGenericItem(bot, 'Commands', bot.isCommandsEnabled ? 'Enabled' : 'Disabled', 'bot.commands'));
            items.push(new PrismBotGenericItem(
                bot, 'Commands Help', bot.isCommandsHelpEnabled ? 'Enabled' : 'Disabled', 'bot.commandHelp')
            );
            items.push(new PrismBotGenericItem(bot, 'Commands Prefix', bot.commandPrefix || 'N/A', 'bot.commandPrefix'));
            items.push(new PrismBotGenericItem(bot, 'Tasks', bot.isTasksEnabled ? 'Enabled' : 'Disabled', 'bot.tasks'));
        }

        if (indicateNone && items.length === 0) {
            let item = new vscode.TreeItem('None Found');
            item.iconPath = {
                light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'info.svg'),
                dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'info.svg')
            };
            items.push(item);
        }
        return Promise.resolve(items);
    }
}

export class PrismBotItem extends vscode.TreeItem {
    public contextValue = 'bot';
    public bot: PrismBot;

    constructor(bot: PrismBot) {
        super('', vscode.TreeItemCollapsibleState.Collapsed);
        this.bot = bot;
        this.label = Util.parentFolderName(bot.folder);
        this.description = bot.folder;

        this.command = {
            command: 'bot.open',
            title: '',
            arguments: [this]
        };

        let selected = Util.currentBot;

        if (selected) {
            this.iconPath = {
                light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'star-full.svg'),
                dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'star-full.svg')
            };
        }
    }
}

export class PrismBotItemUndeclared extends vscode.TreeItem {
    public contextValue = 'botUndeclared';
    public folder: string;

    constructor(folder: string) {
        super('', vscode.TreeItemCollapsibleState.None);
        this.label = Util.currentFolderName(folder);
        let descriptions: string[] = [];
        descriptions.push(folder);
        descriptions.push('[Not Setup]');
        this.description = descriptions.join(' ');
        this.folder = folder;

        this.command = {
            command: 'bot.open',
            title: '',
            arguments: [this]
        };
    }
}

export class PrismBotGenericItem extends vscode.TreeItem {
    public bot: PrismBot;

    constructor(bot: PrismBot, label: string, description: string, contextValue: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.contextValue = contextValue;
        this.bot = bot;
    }
}
