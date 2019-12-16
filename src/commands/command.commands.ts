import * as vscode from 'vscode';
import { PrismCommand, PrismCommandOption } from './command';
import { Util } from '../util';
import { CommandItem, CommandOptionsItem, CommandOptionItem } from './command.provider';
import * as path from 'path';
import { CommandService } from './command.service';
import * as fs from 'fs-extra';
import { PrismBotService } from '../bot/bot.service';
const filenamify = require('filenamify');

export class PrismCommandCommands {
    static setup() {
        vscode.commands.registerCommand('command.refresh', async () => {
            CommandService.instance().reloadCurrent();
        });

        vscode.commands.registerCommand('command.add', async () => {

            if (!Util.currentBot) {
                return vscode.window.showWarningMessage('Bot has not been setup');
            }

            const value = await vscode.window.showInputBox({ prompt: 'Command Name' });
            if (value === undefined) { return; }

            let folderName = filenamify(value);
            let folder = path.join(Util.currentBot.folder, 'commands', folderName);
            if (fs.existsSync(folder)) {
                return vscode.window.showErrorMessage(`Command "${value}" already exists`);
            }

            let command = PrismCommand.create(value);
            command.folder = folder;
            command.save();

            vscode.commands.executeCommand('command.open', new CommandItem(command));
        });

        vscode.commands.registerCommand('command.rename', async (item: CommandItem) => {
            if (!Util.currentBot) { return; }
            if (!item) { return; }

            let command = item.prismCommand;
            const value = await vscode.window.showInputBox({ prompt: 'Command Name', value: command.name });
            if (value === undefined) { return; }

            if (value === command.name) { return; }

            let folderName = filenamify(value);

            let folder = path.join(Util.currentBot.folder, 'commands', folderName);

            if (fs.existsSync(folder)) {
                return vscode.window.showErrorMessage(`Command "${value}" already exists`);
            }

            try {
                fs.renameSync(command.folder, folder);
            } catch (err) {
                return vscode.window.showErrorMessage('Could not rename command');
            }

            command.name = value;
            command.folder = folder;
            command.save();
        });

        vscode.commands.registerCommand('command.description', async (item: CommandItem) => {
            if (!item) { return; }
            let command = item.prismCommand;
            const value = await vscode.window.showInputBox({ prompt: 'Command Description', value: command.description });
            if (value === undefined) { return; }
            command.description = value;
            command.save();
        });

        vscode.commands.registerCommand('command.delete', async (item: CommandItem) => {
            if (!item) { return; }
            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to delete "${item.prismCommand.name}"?`,
                { modal: true }, 'Delete'
            );
            if (!confirm) { return; }
            try {
                fs.removeSync(item.prismCommand.folder);
            } catch (err) {
                vscode.window.showInformationMessage('Could not delete.');
            }
            CommandService.instance().reloadCurrent();
        });

        vscode.commands.registerCommand('command.open', async (item: CommandItem) => {
            if (!item) { return; }
            if (!item.prismCommand.codeFile) {
                item.prismCommand.codeFile = 'code.js';
                item.prismCommand.save();
            }

            let file = path.join(item.prismCommand.folder, item.prismCommand.codeFile);
            if (!fs.existsSync(file)) {
                Util.saveFile(file, '');
            }
            vscode.workspace.openTextDocument(file).then((doc) => {
                vscode.window.showTextDocument(doc);
            });

            if (Util.commandTree) {
                Util.commandTree.reveal(item);
            }
        });

        vscode.commands.registerCommand('command.enable', async (item: CommandItem) => {
            item.prismCommand.isEnabled = !item.prismCommand.isEnabled;
            item.prismCommand.save();
        });

        vscode.commands.registerCommand('command.enableHelp', async (item: CommandItem) => {
            item.prismCommand.isHelpEnabled = !item.prismCommand.isHelpEnabled;
            item.prismCommand.save();
        });

        vscode.commands.registerCommand('command.option.add', async (item: CommandOptionsItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({
                prompt: 'Flags',
                placeHolder: 'https://github.com/tj/commander.js i.e. -n, --number [ value ]'
            });
            if (value === undefined) { return; }
            let option = PrismCommandOption.create(value);
            item.prismCommand.options.push(option);
            item.prismCommand.save();

            if (Util.commandTree) {
                Util.commandTree.reveal(new CommandOptionItem(item.prismCommand, option));
            }
        });

        vscode.commands.registerCommand('command.option.flags', async (item: CommandOptionItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({
                prompt: 'Flags',
                value: item.option.flags,
                placeHolder: 'https://github.com/tj/commander.js i.e. -n, --number [ value ]'
            });
            if (value === undefined) { return; }
            item.option.flags = value;
            item.prismCommand.save();
        });

        vscode.commands.registerCommand('command.option.description', async (item: CommandOptionItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'Description', value: item.option.description });
            if (value === undefined) { return; }
            item.option.description = value;
            item.prismCommand.save();
        });

        vscode.commands.registerCommand('command.option.defaultValue', async (item: CommandOptionItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'Default Value', value: item.option.defaultValue });
            if (value === undefined) { return; }
            item.option.defaultValue = value;
            item.prismCommand.save();
        });

        vscode.commands.registerCommand('command.option.delete', async (item: CommandOptionItem) => {
            if (!item) { return; }
            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to delete "${item.option.flags}"?`,
                { modal: true }, 'Delete'
            );
            if (!confirm) { return; }
            let list: PrismCommandOption[] = [];
            for (let i = 0; i < item.prismCommand.options.length; i++) {
                if (item.prismCommand.options[i].id !== item.option.id) {
                    list.push(item.prismCommand.options[i]);
                }
            }
            item.prismCommand.options = list;
            item.prismCommand.save();
        });
    }
}
