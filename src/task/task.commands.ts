import { Util } from '../util';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { PrismTask } from './task';
import { PrismTaskItem } from './task.provider';
import { PrismTaskService } from './task.service';
import { PrismBotService } from '../bot/bot.service';
const filenamify = require('filenamify');

export class PrismTaskCommands {
    static setup() {
        /** Start Task */
        vscode.commands.registerCommand('task.refresh', async () => {
            PrismTaskService.instance().reloadCurrent();
        });

        vscode.commands.registerCommand('task.add', async () => {
            if (!Util.currentBot) {
                return vscode.window.showWarningMessage('You need to select a bot');
            }

            const value = await vscode.window.showInputBox({ prompt: 'Task Name' });
            if (value === undefined) { return; }

            let folderName = filenamify(value);
            let folder = path.join(Util.currentBot.folder, 'tasks', folderName);
            if (fs.existsSync(folder)) {
                return vscode.window.showErrorMessage(`Task "${value}" already exists`);
            }

            let task = PrismTask.create(value);
            task.folder = folder;
            task.save();

            vscode.commands.executeCommand('task.open', new PrismTaskItem(task));
        });

        vscode.commands.registerCommand('task.enable', async (item: PrismTaskItem) => {
            item.task.isEnabled = !item.task.isEnabled;
            item.task.save();
        });

        vscode.commands.registerCommand('task.rename', async (item: PrismTaskItem) => {
            if (!Util.currentBot) { return; }

            if (!item) { return; }
            let task = item.task;
            const value = await vscode.window.showInputBox({ prompt: 'Task Name', value: task.name });
            if (value === undefined) { return; }

            let folderName = filenamify(value);
            let folder = path.join(Util.currentBot.folder, 'tasks', folderName);
            if (fs.existsSync(folder)) {
                return vscode.window.showErrorMessage(`Task "${value}" already exists`);
            }
            try {
                fs.renameSync(task.folder, folder);
            } catch (err) {
                return vscode.window.showErrorMessage('Could not rename task');
            }

            task.name = value;
            task.folder = folder;
            task.save();
        });

        vscode.commands.registerCommand('task.schedule', async (item: PrismTaskItem) => {
            if (!item) { return; }
            let task = item.task;
            const value = await vscode.window.showInputBox({
                prompt: 'Task Schedule',
                placeHolder: 'https://www.npmjs.com/package/node-schedule',
                value: task.schedule
            });
            if (value === undefined) { return; }
            task.schedule = value;
            task.save();
        });

        vscode.commands.registerCommand('task.delete', async (item: PrismTaskItem) => {
            if (!item) { return; }
            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to delete "${item.task.name}"?`,
                { modal: true }, 'Delete'
            );
            if (!confirm) { return; }
            try {
                fs.removeSync(item.task.folder);
            } catch (err) {
                vscode.window.showInformationMessage('Could not delete.');
            }
            PrismTaskService.instance().reloadCurrent();
        });

        vscode.commands.registerCommand('task.open', async (item: PrismTaskItem) => {
            if (!item) { return; }
            if (!item.task.codeFile) {
                item.task.codeFile = 'code.js';
                item.task.save();
            }

            let file = path.join(item.task.folder, item.task.codeFile);
            if (!fs.existsSync(file)) {
                Util.saveFile(file, '');
            }
            vscode.workspace.openTextDocument(file).then((doc) => {
                vscode.window.showTextDocument(doc);
            });

            if (Util.taskTree) {
                Util.taskTree.reveal(item);
            }
        });
        /** End Task */
    }
}
