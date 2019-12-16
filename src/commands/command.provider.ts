import * as vscode from 'vscode';
import * as path from 'path';
import { Util } from '../util';
import { PrismCommand, PrismCommandOption } from './command';

export class CommandProvider implements vscode.TreeDataProvider<any> {
    // tslint:disable-next-line: variable-name
    private _onDidChangeTreeData: vscode.EventEmitter<any | undefined> = new vscode.EventEmitter<any | undefined>();
    // tslint:disable-next-line: member-ordering
    readonly onDidChangeTreeData: vscode.Event<any | undefined> = this._onDidChangeTreeData.event;
    private commands: PrismCommand[] = [];
    constructor() {
        Util.commandsChanged.subscribe({
            next: (commands: PrismCommand[]) => {
                this.commands = commands;
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
        switch (element.contextValue) {
            case 'command.option':
                return new CommandItem(element.prismCommand);
        }
        return null;
    }

    getChildren(element?: any): Thenable<any[]> {
        let children: any[] = [];
        let indicateNone: boolean = false;

        if (!element) {
            for (let i = 0; i < this.commands.length; i++) {
                children.push(new CommandItem(this.commands[i]));
            }
            indicateNone = true;
        } else if (element.contextValue === 'command') {
            let command: PrismCommand = element.prismCommand;
            children.push(new CommandOptionsItem(command));
        } else if (element.contextValue === 'command.options') {
            let command: PrismCommand = element.prismCommand;
            for (let i = 0; i < command.options.length; i++) {
                children.push(new CommandOptionItem(command, command.options[i]));
            }
        }

        if (indicateNone && children.length === 0) {
            let item = new vscode.TreeItem('None Found');
            item.iconPath = {
                light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'info.svg'),
                dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'info.svg')
            };
            children.push(item);
        }

        return Promise.resolve(children);
    }
}

export class CommandItem extends vscode.TreeItem {
    public contextValue = 'command';
    public prismCommand: PrismCommand;

    constructor(command: PrismCommand) {
        super(command.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.prismCommand = command;
        this.id = `${command.id}`;
        this.tooltip = command.folder;

        let descriptions: string[] = [];
        if (!command.isEnabled) {
            descriptions.push('[ Disabled ]');
        }
        if (!command.isHelpEnabled) {
            descriptions.push('[ Help Disabled ]');
        }
        descriptions.push(`${this.command || 'No Description'}`);
        this.description = descriptions.join(' ');

        this.command = {
            command: 'command.open',
            title: '',
            arguments: [this]
        };
    }
}

export class CommandOptionsItem extends vscode.TreeItem {
    public contextValue = 'command.options';
    public prismCommand: PrismCommand;

    constructor(command: PrismCommand) {
        super('Options', vscode.TreeItemCollapsibleState.Expanded);
        this.prismCommand = command;
        this.id = `${command.id}/command.options`;
        this.description = `${command.options.length}`;

        if (command.options.length === 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
    }
}

export class CommandOptionItem extends vscode.TreeItem {
    public contextValue = 'command.option';
    public prismCommand: PrismCommand;
    public option: PrismCommandOption;

    constructor(command: PrismCommand, option: PrismCommandOption) {
        super((option.flags || 'N/A'), vscode.TreeItemCollapsibleState.None);
        this.prismCommand = command;
        this.option = option;
        this.id = `${command.id}/command.options/${option.id}`;
        this.tooltip = option.id;

        let descriptions: string[] = [];
        if (option.defaultValue !== undefined) {
            descriptions.push(`[ ${option.defaultValue} ]`);
        }
        descriptions.push(`${option.description || 'No Description'}`);
        this.description = descriptions.join(' ');
    }
}
