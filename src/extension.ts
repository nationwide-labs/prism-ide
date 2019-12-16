import * as vscode from 'vscode';
import { Util } from './util';
import { FlowPanel } from './intent/flow';
import { PrismIntentService } from './intent/intent.service';
import { PrismBotService } from './bot/bot.service';
import { IntentsProvider } from './intent/intent.provider';
import { PrismServerProvider } from './server/server.provider';
import { CommandService } from './commands/command.service';
import { CommandProvider } from './commands/command.provider';
import { PrismTaskProvider } from './task/task.provider';
import { PrismTaskService } from './task/task.service';
import { PrismServerService } from './server/server.service';
import { BotsProvider } from './bot/bot.provider';

export function activate(context: vscode.ExtensionContext) {
	vscode.window.onDidChangeWindowState((state: vscode.WindowState) => {
		Util.isFocused = state && state.focused;
	});

	FlowPanel.instance();
	PrismIntentService.instance();
	PrismBotService.instance();
	PrismServerService.instance();
	CommandService.instance();
	PrismTaskService.instance();

	Util.context = context;

	Util.intentsTree = vscode.window.createTreeView('intents', {
		treeDataProvider: new IntentsProvider(),
		showCollapseAll: true
	});

	Util.botsTree = vscode.window.createTreeView('bots', {
		treeDataProvider: new BotsProvider()
	});

	Util.serverTree = vscode.window.createTreeView('servers', {
		treeDataProvider: new PrismServerProvider()
	});

	Util.commandTree = vscode.window.createTreeView('commands', {
		treeDataProvider: new CommandProvider(),
		showCollapseAll: true
	});

	Util.taskTree = vscode.window.createTreeView('tasks', {
		treeDataProvider: new PrismTaskProvider()
	});
	PrismBotService.instance().reload();
}

export function deactivate() {
	console.log('Prism Deactivated');
}
