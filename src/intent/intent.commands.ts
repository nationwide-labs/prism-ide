import * as vscode from 'vscode';
import { Util } from '../util';
import * as path from 'path';
import * as fs from 'fs-extra';
import { PrismIntentService } from './intent.service';
import { PrismIntent, PrismIntentTrigger, PrismIntentUtterance } from './intent';
import { IntentItem, TriggerItem, UtteranceItem, UtterancesItem, TriggersItem } from './intent.provider';
import { FlowPanel } from './flow';
const filenamify = require('filenamify');

export class PrismIntentCommands {
    static setup() {
        /** Start Intent */
        vscode.commands.registerCommand('intent.refresh', async () => {
            PrismIntentService.instance().reloadCurrent();
        });

        vscode.commands.registerCommand('intent.add', async () => {
            if (!Util.currentBot) {
                return vscode.window.showWarningMessage('Bot has not been setup');
            }

            const value = await vscode.window.showInputBox({ prompt: 'Intent Name' });
            if (value === undefined) { return; }

            let folderName = filenamify(value);

            let folder = path.join(Util.currentBot.folder, 'intents', folderName);

            if (fs.existsSync(folder)) {
                return vscode.window.showErrorMessage(`Intent "${value}" already exists`);
            }

            let intent = PrismIntent.create(value);
            intent.folder = folder;
            intent.save();

            vscode.commands.executeCommand('intent.open', new IntentItem(intent));
        });

        vscode.commands.registerCommand('intent.enable', async (item: IntentItem) => {
            item.intent.isEnabled = !item.intent.isEnabled;
            item.intent.save();
        });

        vscode.commands.registerCommand('intent.rename', async (item: IntentItem) => {
            if (!Util.currentBot) { return; }

            if (!item) { return; }
            let intent = item.intent;
            const value = await vscode.window.showInputBox({ prompt: 'Intent Name', value: intent.name });
            if (value === undefined) { return; }
            if (value === intent.name) { return; }

            let folderName = filenamify(value);

            let folder = path.join(Util.currentBot.folder, 'intents', folderName);
            if (fs.existsSync(folder)) {
                return vscode.window.showErrorMessage(`Intent "${value}" already exists`);
            }

            try {
                fs.renameSync(intent.folder, folder);
            } catch (err) {
                return vscode.window.showErrorMessage('Could not rename intent');
            }

            intent.name = value;
            intent.folder = folder;
            intent.save();
        });

        vscode.commands.registerCommand('intent.delete', async (item: IntentItem) => {
            if (!item) { return; }
            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to delete "${item.intent.name}" ? `,
                { modal: true }, 'Delete'
            );
            if (!confirm) { return; }
            try {
                fs.removeSync(item.intent.folder);
            } catch (err) {
                vscode.window.showInformationMessage('Could not delete.');
            }
            PrismIntentService.instance().reloadCurrent();
        });

        vscode.commands.registerCommand('intent.open', async (item: IntentItem) => {
            if (!item) { return; }
            let flowPanel = FlowPanel.instance();
            flowPanel.setIntent(item.intent);

            if (Util.intentsTree) {
                Util.intentsTree.reveal(item);
            }

            for (let i = 0; i < item.intent.nodes.length; i++) {
                if (item.intent.nodes[i].id === item.intent.defaultNodeId) {
                    flowPanel.scrollToNode(item.intent.nodes[i], false);
                }
            }
        });
        /** End Intent */

        /** Start Trigger */
        vscode.commands.registerCommand('trigger.add', async (item: TriggersItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'Trigger Name' });
            if (value === undefined) { return; }

            let trigger = PrismIntentTrigger.create(value);

            item.intent.triggers.push(trigger);
            item.intent.save();

            if (Util.intentsTree) {
                Util.intentsTree.reveal(new TriggerItem(item.intent, trigger));
            }
        });

        vscode.commands.registerCommand('trigger.edit', async (item: TriggerItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'Trigger Name', value: item.trigger.name });
            if (value === undefined) { return; }
            item.trigger.name = value;
            item.intent.save();
        });

        vscode.commands.registerCommand('trigger.delete', async (item: TriggerItem) => {
            if (!item) { return; }
            let trigger = item.trigger;
            let confirm = await vscode.window.showInformationMessage(`Are you sure you want to delete "${trigger.name}?"`, { modal: true }, 'Delete');
            if (!confirm) { return; }

            let intent = item.intent;
            let triggers: PrismIntentTrigger[] = [];
            for (let i = 0; i < intent.triggers.length; i++) {
                if (intent.triggers[i].id !== trigger.id) {
                    triggers.push(intent.triggers[i]);
                }
            }
            intent.triggers = triggers;
            intent.save();
        });
        /** End Trigger */

        /** Start Utterances */
        vscode.commands.registerCommand('utterance.add', async (item: UtterancesItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'Utterance Name' });
            if (value === undefined) { return; }
            let uttterance = PrismIntentUtterance.create(value);
            item.intent.utterances.push(uttterance);
            item.intent.save();

            if (Util.intentsTree) {
                Util.intentsTree.reveal(new UtteranceItem(item.intent, uttterance));
            }
        });

        vscode.commands.registerCommand('utterance.edit', async (item: UtteranceItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'Utterance Name', value: item.utterance.name });
            if (value === undefined) { return; }
            item.utterance.name = value;
            item.intent.save();
        });

        vscode.commands.registerCommand('utterance.delete', async (item: UtteranceItem) => {
            if (!item) { return; }
            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to delete "${item.utterance.name}" ? `,
                { modal: true }, 'Delete'
            );
            if (!confirm) { return; }
            let intent = item.intent;
            let utterances: PrismIntentUtterance[] = [];
            for (let i = 0; i < intent.utterances.length; i++) {
                if (intent.utterances[i].id !== item.utterance.id) {
                    utterances.push(intent.utterances[i]);
                }
            }
            intent.utterances = utterances;
            intent.save();
        });
        /** End Utterances */
    }
}
