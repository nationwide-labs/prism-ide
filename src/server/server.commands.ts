import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { Util } from '../util';
import { PrismServerService } from './server.service';
import { PrismServerItem } from './server.provider';
import { PrismServer } from './server';
import request = require('request');
import AdmZip = require('adm-zip');
import { PrismBotService } from '../bot/bot.service';

export class PrismServerCommands {
    static setup() {
        /** Start Server */
        vscode.commands.registerCommand('server.refresh', () => {
            PrismServerService.instance().reload();
        });

        vscode.commands.registerCommand('server.add', async () => {
            const value = await vscode.window.showInputBox({ prompt: 'Server Name' });
            if (value === undefined) { return; }

            let server = PrismServer.create(value);
            let list = PrismServerService.instance().list();
            list.push(server);
            PrismServerService.instance().setServers(list);

            if (Util.serverTree) {
                Util.serverTree.reveal(new PrismServerItem(server));
            }
        });

        vscode.commands.registerCommand('server.rename', async (item: PrismServerItem) => {
            if (!item) { return; }

            const value = await vscode.window.showInputBox({ prompt: 'Server Name', value: item.server.name });
            if (value === undefined) { return; }
            item.server.name = value;
            PrismServerService.instance().save();
        });

        vscode.commands.registerCommand('server.credentials', async (item: PrismServerItem) => {
            if (!item) { return; }

            const value = await vscode.window.showInputBox({
                prompt: 'Server Name',
                value: new Buffer(item.server.credentials || '', 'base64').toString('ascii'),
                placeHolder: 'key:secret'
            });
            if (value === undefined) { return; }
            let buff = new Buffer(value);
            item.server.credentials = buff.toString('base64');
            PrismServerService.instance().save();
        });

        vscode.commands.registerCommand('server.url', async (item: PrismServerItem) => {
            if (!item) { return; }

            const value = await vscode.window.showInputBox({
                prompt: 'Server Url',
                placeHolder: 'i.e. http://localhost:9090',
                value: item.server.url
            });
            if (value === undefined) { return; }
            item.server.url = value;
            PrismServerService.instance().save();
        });

        vscode.commands.registerCommand('server.delete', async (item: PrismServerItem) => {
            if (!item) { return; }

            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to delete to "${item.server.name}"?`,
                { modal: true }, 'Delete'
            );
            if (!confirm) { return; }

            let servers = PrismServerService.instance().list();
            let newList: PrismServer[] = [];
            for (let i = 0; i < servers.length; i++) {
                if (servers[i].id !== item.server.id) {
                    newList.push(servers[i]);
                }
            }
            PrismServerService.instance().setServers(newList);
        });

        vscode.commands.registerCommand('server.bot.publish', async (item: PrismServerItem) => {
            if (!Util.currentBot) {
                return vscode.window.showWarningMessage('You need to select a bot');
            }

            if (!item.server.url) {
                return vscode.window.showInformationMessage('Missing Url');
            }

            if (!fs.existsSync(Util.currentBot.folder)) {
                return vscode.window.showInformationMessage('No prism-bot in the current working folder.');
            }

            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to publish to "${item.server.name}"?`,
                { modal: true }, 'Publish'
            );
            if (!confirm) { return; }

            let zip = new AdmZip();
            zip.addLocalFolder(Util.currentBot.folder);
            try {
                request.post({
                    url: `${item.server.url}/publish`,
                    json: true,
                    headers: {
                        authorization: item.server.credentials
                    },
                    body: {
                        zip: zip.toBuffer().toString('base64')
                    }
                }, (err: any, resp: any, body: any) => {
                    console.log(body);

                    if (body && body.success) {
                        return vscode.window.showInformationMessage(body.message);
                    }
                    if (body && body.message) {
                        return vscode.window.showInformationMessage(body.message);
                    }
                    return vscode.window.showInformationMessage('Could not publish');
                });
            } catch (err) {
                console.log(err);
                return vscode.window.showInformationMessage('Could not publish');
            }
        });

        vscode.commands.registerCommand('server.bot.ping', async (item: PrismServerItem) => {
            if (!Util.currentBot) {
                return vscode.window.showWarningMessage('You need to select a bot');
            }

            if (!item.server.url) {
                return vscode.window.showInformationMessage('Missing Url');
            }

            if (!fs.existsSync(Util.currentBot.folder)) {
                return vscode.window.showInformationMessage('No prism-bot in the current working folder.');
            }

            try {
                request.post({
                    url: `${item.server.url}/ping`,
                    json: true,
                    headers: {
                        authorization: item.server.credentials
                    },
                    body: {}
                }, (err: any, resp: any, body: any) => {
                    console.log(body);

                    if (body && body.success) {
                        return vscode.window.showInformationMessage(body.message);
                    }
                    if (body && body.message) {
                        return vscode.window.showInformationMessage(body.message);
                    }
                    return vscode.window.showInformationMessage('Could not ping');
                });
            } catch (err) {
                console.log(err);
                return vscode.window.showInformationMessage('Could not ping');
            }
        });

        /** End Server */
    }
}
