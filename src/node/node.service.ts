import { PrismNode, PrismNodeAnswer, PrismNodeState } from './node';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { Util } from '../util';
import { PrismIntent } from '../intent/intent';
import { PrismIntentService } from '../intent/intent.service';
import { PrismNodeCommands } from './node.commands';
import { StatesItem, AnswersItem } from '../intent/intent.provider';
export class LinkData {
    fromConnector!: string;
    fromOperator!: string;
    fromSubConnector!: string;
    toConnector!: string;
    toOperator!: string;
    toSubConnector!: string;
}

let varInstance: NodeService;

export class NodeService {
    static instance(): NodeService {
        if (!varInstance) {
            varInstance = new NodeService();
            PrismNodeCommands.setup();
        }
        return varInstance;
    }

    async move(intent: PrismIntent, id: string, top: any, left: any) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        node.top = top;
        node.left = left;
        intent.save();
    }

    async link(intent: PrismIntent, linkData: LinkData) {
        let parts = linkData.fromConnector.split('.');
        let node = this.findById(intent, parts[2]);

        if (!node) { return; }

        if (parts[0] === 'answer') {
            let answer = this.findAnswerById(node, parts[3]);
            if (answer) {
                answer.nextNodeId = linkData.toOperator;
            }
        } else if (parts[0] === 'default') {
            node.defaultNodeId = linkData.toOperator;
        } else if (parts[0] === 'state') {
            let state = this.findStateById(node, parts[3]);
            if (state) {
                state.nextNodeId = linkData.toOperator;
            }
        }

        intent.save();
    }

    async editCodeBefore(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        if (!node.codeBeforeFile) {
            node.codeBeforeFile = `node-${node.id}-before.js`;
            node.isCodeBeforeEnabled = true;
            intent.save();
        }

        let codeFolder = path.join(intent.folder, 'code');
        Util.ensurePath(codeFolder);

        let file = path.join(codeFolder, node.codeBeforeFile);
        if (!fs.existsSync(file)) {
            Util.saveFile(file, '');
            intent.save();
        }
        vscode.workspace.openTextDocument(file).then((doc) => {
            vscode.window.showTextDocument(doc, {
                viewColumn: vscode.ViewColumn.Beside
            });
        });
    }

    async toggleCodeBefore(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        node.isCodeBeforeEnabled = !node.isCodeBeforeEnabled;
        intent.save();
    }

    async toggleCodeAfter(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        node.isCodeAfterEnabled = !node.isCodeAfterEnabled;
        intent.save();
    }

    async editCodeAfter(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        if (!node.codeAfterFile) {
            node.codeAfterFile = `node-${node.id}-after.js`;
            node.isCodeAfterEnabled = true;
            intent.save();
        }

        let codeFolder = path.join(intent.folder, 'code');
        Util.ensurePath(codeFolder);

        let file = path.join(codeFolder, node.codeAfterFile);
        if (!fs.existsSync(file)) {
            Util.saveFile(file, '');
            intent.save();
        }
        vscode.workspace.openTextDocument(file).then((doc) => {
            vscode.window.showTextDocument(doc, {
                viewColumn: vscode.ViewColumn.Beside
            });
        });
    }

    async delete(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }

        let confirm = await vscode.window.showInformationMessage(
            `Are you sure you want to delete this node?`,
            { modal: true }, 'Delete'
        );
        if (!confirm) { return; }
        let nodes: PrismNode[] = [];
        for (let i = 0; i < intent.nodes.length; i++) {
            if (intent.nodes[i].id !== node.id) {
                nodes.push(intent.nodes[i]);
            }
        }
        intent.nodes = nodes;
        intent.save();
    }

    async setDefaultStart(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }

        let confirm = await vscode.window.showInformationMessage(
            `Are you sure you want to set this as the default start?`,
            { modal: true }, 'Set Default'
        );
        if (!confirm) { return; }
        intent.defaultNodeId = node.id;
        intent.save();
    }

    async editName(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        const value = await vscode.window.showInputBox({ prompt: 'Name', value: node.text });
        if (value === undefined) { return; }
        node.text = value;
        intent.save();
    }

    async editPrompt(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        const value = await vscode.window.showInputBox({ prompt: 'Prompt', value: node.text });
        if (value === undefined) { return; }
        node.text = value;
        intent.save();
    }

    async editVariable(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        const value = await vscode.window.showInputBox({ prompt: 'Variable', value: node.variable });
        if (value === undefined) { return; }
        node.variable = value;
        intent.save();
    }

    async editText(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }
        const value = await vscode.window.showInputBox({ prompt: 'Text', value: node.text });
        if (value === undefined) { return; }
        node.text = value;
        intent.save();
    }

    async addState(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (node) {
            vscode.commands.executeCommand('state.add', new StatesItem(intent, node));
        }
    }

    async addAnswer(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (node) {
            vscode.commands.executeCommand('answer.add', new AnswersItem(intent, node));
        }
    }

    async editReference(intent: PrismIntent, id: string) {
        let node = this.findById(intent, id);
        if (!node) { return; }

        let intents = PrismIntentService.instance().list(Util.currentBot);
        let choices: any[] = [];

        choices.push({
            label: 'None'
        });

        for (let i = 0; i < intents.length; i++) {
            for (let j = 0; j < intents[i].nodes.length; j++) {
                if (intents[i].nodes[j].isStart()) {
                    choices.push({
                        label: intents[i].name + '/' + intents[i].nodes[j].text,
                        intent: intents[i],
                        node: intents[i].nodes[j]
                    });
                }
            }
        }

        const value = await vscode.window.showQuickPick(choices, {
            placeHolder: 'Which intent/node?'
        });

        if (value) {
            node.referenceIntentId = value.intent ? value.intent.id : undefined;
            node.referenceNodeId = value.node ? value.node.id : undefined;
            intent.save();
        }
    }

    findById(intent: PrismIntent, id: string): PrismNode | undefined {
        for (let i = 0; i < intent.nodes.length; i++) {
            if (intent.nodes[i].id === id) {
                return intent.nodes[i];
            }
        }
    }

    findAnswerById(node: PrismNode, id: string): PrismNodeAnswer | undefined {
        for (let i = 0; i < node.answers.length; i++) {
            if (node.answers[i].id === id) {
                return node.answers[i];
            }
        }
    }

    findStateById(node: PrismNode, id: string): PrismNodeState | undefined {
        for (let i = 0; i < node.states.length; i++) {
            if (node.states[i].id === id) {
                return node.states[i];
            }
        }
    }
}
