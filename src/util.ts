import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Subject } from 'rxjs';
import { PrismCommand } from './commands/command';
import { PrismTask } from './task/task';
import { PrismBot } from './bot/bot';
import { PrismIntent } from './intent/intent';
import { PrismServer } from './server/server';
import { PrismBotService } from './bot/bot.service';
import { CommandService } from './commands/command.service';
import { PrismIntentService } from './intent/intent.service';
import { PrismServerService } from './server/server.service';
import { PrismTaskService } from './task/task.service';
import { BotsProvider } from './bot/bot.provider';

export class Util {
    static botsTree: vscode.TreeView<BotsProvider> | undefined;
    static intentsTree: vscode.TreeView<any> | undefined;
    static serverTree: vscode.TreeView<any> | undefined;
    static commandTree: vscode.TreeView<any> | undefined;
    static taskTree: vscode.TreeView<any> | undefined;
    static context: vscode.ExtensionContext | undefined;

    static botsChanged = new Subject<PrismBot[]>();
    static botChanged = new Subject<PrismBot>();
    static intentsChanged = new Subject<PrismIntent[]>();
    static intentChanged = new Subject<PrismIntent>();
    static serversChanged = new Subject<PrismServer[]>();
    static commandsChanged = new Subject<PrismCommand[]>();
    static tasksChanged = new Subject<PrismTask[]>();
    static fileWatcher: vscode.FileSystemWatcher | undefined;
    static isFocused: boolean = true;

    static currentBot: PrismBot | undefined;

    static openBot(bot: PrismBot | undefined) {
        this.currentBot = bot;
        this.botChanged.next(bot);
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }
        if (bot) {
            let pattern = new vscode.RelativePattern(bot.folder, '**');

            // createFileSystemWatcher seems a little buggy
            // But eventually we want to switch over to use this instead of reloading as things happen
            this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);
            this.fileWatcher.onDidChange((a: any) => {
                if (!this.isFocused) {
                    this.reload();
                }
            });
        }
        this.reload();
    }

    static reload() {
        CommandService.instance().reloadCurrent();
        PrismIntentService.instance().reloadCurrent();
        PrismServerService.instance().reload();
        PrismTaskService.instance().reloadCurrent();
    }

    static readJSON(filePath: string) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (error) {
            console.log(error ? error.message : error);
        }
    }

    static saveJSON(filePath: string, data: any) {
        let content = JSON.stringify(data, null, 2);
        try {
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        } catch (error) {
            console.log(error ? error.message : error);
        }
        return false;
    }

    static ensurePath(filePath: string) {
        filePath = filePath || '';

        const sep = path.sep;
        const initDir = path.isAbsolute(filePath) ? sep : '';

        filePath.split(sep).reduce((parentDir, childDir) => {
            const curDir = path.resolve(parentDir, childDir);
            if (!fs.existsSync(curDir)) {
                fs.mkdirSync(curDir);
            }
            return curDir;
        }, initDir);
    }

    static readFile(filePath: string) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            console.log(error ? error.message : error);
        }
    }

    static saveFile(filePath: string, content: any) {
        try {
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        } catch (error) {
            console.log(error ? error.message : error);
        }
        return false;
    }

    static parentFolderName(filePath: string): string | undefined {
        try {
            return path.basename(path.dirname(filePath));
        } catch (error) { }
        return undefined;
    }

    static currentFolderName(filePath: string): string | undefined {
        try {
            return path.basename(filePath);
        } catch (error) { }
        return undefined;
    }

    static arrayMove(arr: any[], oldIndex: number, newIndex: number) {
        if (newIndex >= arr.length) {
            let k = newIndex - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
        return arr;
    }
}
