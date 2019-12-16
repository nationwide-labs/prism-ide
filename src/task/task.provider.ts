import * as vscode from 'vscode';
import * as path from 'path';
import { Util } from '../util';
import { PrismTask } from './task';

export class PrismTaskProvider implements vscode.TreeDataProvider<any> {
    // tslint:disable-next-line: variable-name
    private _onDidChangeTreeData: vscode.EventEmitter<any | undefined> = new vscode.EventEmitter<any | undefined>();
    // tslint:disable-next-line: member-ordering
    readonly onDidChangeTreeData: vscode.Event<any | undefined> = this._onDidChangeTreeData.event;
    private tasks: PrismTask[] = [];
    constructor() {
        Util.tasksChanged.subscribe({
            next: (tasks: PrismTask[]) => {
                this.tasks = tasks;
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
        if (!element) {
            let items = [];
            for (let i = 0; i < this.tasks.length; i++) {
                items.push(new PrismTaskItem(this.tasks[i]));
            }
            if (items.length === 0) {
                let item = new vscode.TreeItem('None Found');
                item.iconPath = {
                    light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'info.svg'),
                    dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'info.svg')
                };
                items.push(item);
            }
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
}

export class PrismTaskItem extends vscode.TreeItem {
    public contextValue = 'task';
    public task: PrismTask;

    constructor(task: PrismTask) {
        super(task.name, vscode.TreeItemCollapsibleState.None);
        this.task = task;
        this.id = `${task.id}`;
        this.tooltip = task.folder;

        let descriptions: string[] = [];
        if (!task.isEnabled) {
            descriptions.push('[ Disabled ]');
        }
        descriptions.push(`${task.schedule || 'Not Scheduled'}`);
        this.description = descriptions.join(' ');

        this.command = {
            command: 'task.open',
            title: '',
            arguments: [this]
        };
    }
}
