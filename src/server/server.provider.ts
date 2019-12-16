import * as vscode from 'vscode';
import * as path from 'path';
import { Util } from '../util';
import { PrismServer } from './server';

export class PrismServerProvider implements vscode.TreeDataProvider<any> {
    // tslint:disable-next-line: variable-name
    private _onDidChangeTreeData: vscode.EventEmitter<any | undefined> = new vscode.EventEmitter<any | undefined>();
    // tslint:disable-next-line: member-ordering
    readonly onDidChangeTreeData: vscode.Event<any | undefined> = this._onDidChangeTreeData.event;
    private servers: PrismServer[] = [];

    constructor() {
        Util.serversChanged.subscribe({
            next: (servers: PrismServer[]) => {
                this.servers = servers;
                this.refresh();
            }
        });
    }

    getParent(element?: any) {
        return null;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }

    getChildren(element?: any): Thenable<any[]> {
        if (element) {
            return Promise.resolve([]);
        }

        let items = [];
        for (let i = 0; i < this.servers.length; i++) {
            items.push(new PrismServerItem(this.servers[i]));
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
}

export class PrismServerItem extends vscode.TreeItem {
    public contextValue = 'server';
    public server: PrismServer;

    constructor(server: PrismServer) {
        super((server.name || 'N/A'), vscode.TreeItemCollapsibleState.None);
        this.description = server.url || 'Missing Url';
        this.server = server;
        this.id = `${server.id}`;
    }
}
