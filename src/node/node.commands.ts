import { PrismNodeAnswer, PrismNodeState, NodeTypes, PrismNode } from './node';
import * as vscode from 'vscode';
import { Util } from '../util';
import { StateItem, AnswerItem, StatesItem, AnswersItem, NodeItem } from '../intent/intent.provider';
import { FlowPanel } from '../intent/flow';

export class PrismNodeCommands {
    static setup() {
        /** Start Node */
        vscode.commands.registerCommand('node.open', async (item: NodeItem) => {
            if (!item) { return; }
            let flowPanel = FlowPanel.instance();
            flowPanel.setIntent(item.intent);
            flowPanel.scrollToNode(item.node, true);
        });

        vscode.commands.registerCommand('node.delete', async (item: NodeItem) => {
            if (!item) { return; }
            let intent = item.intent;
            let node = item.node;

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
        });
        /** End Node */

        /** Start States */
        vscode.commands.registerCommand('state.node', async (item: StateItem) => {
            if (!item) { return; }
            let choices: any[] = [{ label: 'None' }];

            for (let i = 0; i < item.intent.nodes.length; i++) {
                let node = item.intent.nodes[i];
                choices.push({
                    label: NodeTypes.types[node.type],
                    description: (node.text || '') + (node.variable ? ` [ ${node.variable} ]` : ''),
                    node: item.intent.nodes[i]
                });
            }
            const value = await vscode.window.showQuickPick(choices, { placeHolder: 'Which Node?' });
            if (value) {
                item.state.nextNodeId = value.node ? value.node.id : undefined;
                item.intent.save();
            }
        });

        vscode.commands.registerCommand('answer.node', async (item: AnswerItem) => {
            if (!item) { return; }
            let choices: any[] = [{ label: 'None' }];

            for (let i = 0; i < item.intent.nodes.length; i++) {
                let node = item.intent.nodes[i];
                choices.push({
                    label: NodeTypes.types[node.type],
                    description: (node.text || '') + (node.variable ? ` [ ${node.variable} ]` : ''),
                    node: item.intent.nodes[i]
                });
            }
            const value = await vscode.window.showQuickPick(choices, { placeHolder: 'Which Node?' });
            if (value) {
                item.answer.nextNodeId = value.node ? value.node.id : undefined;
                item.intent.save();
            }
        });

        vscode.commands.registerCommand('state.add', async (item: StatesItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'State Name' });
            if (value === undefined) { return; }
            let state = PrismNodeState.create(value);
            item.node.states.push(state);
            item.intent.save();
            if (Util.intentsTree) {
                Util.intentsTree.reveal(new StateItem(item.intent, item.node, state));
            }
        });

        vscode.commands.registerCommand('state.edit', async (item: StateItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'State Name', value: item.state.name });
            if (value === undefined) { return; }
            item.state.name = value;
            item.intent.save();
        });

        vscode.commands.registerCommand('state.delete', async (item: StateItem) => {
            if (!item) { return; }
            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to delete "${item.state.name}"?`,
                { modal: true }, 'Delete'
            );
            if (!confirm) { return; }

            let node = item.node;

            let states: PrismNodeState[] = [];
            for (let i = 0; i < node.states.length; i++) {
                if (node.states[i].id !== item.state.id) {
                    states.push(node.states[i]);
                }
            }
            node.states = states;
            item.intent.save();
        });
        /** End States */

        /** Start Answers */
        vscode.commands.registerCommand('answer.add', async (item: AnswersItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'Answer Name' });
            if (value === undefined) { return; }
            let answer = PrismNodeAnswer.create(value);
            answer.order = item.node.answers.length;
            item.node.answers.push(answer);
            item.intent.save();
            if (Util.intentsTree) {
                Util.intentsTree.reveal(new AnswerItem(item.intent, item.node, answer));
            }
        });

        vscode.commands.registerCommand('answer.edit', async (item: AnswerItem) => {
            if (!item) { return; }
            const value = await vscode.window.showInputBox({ prompt: 'Answer Name', value: item.answer.name });
            if (value === undefined) { return; }
            item.answer.name = value;
            item.intent.save();
        });

        vscode.commands.registerCommand('answer.moveUp', async (item: AnswerItem) => {
            if (!item) { return; }

            let index = 0;

            for (let i = 0; i < item.node.answers.length; i++) {
                if (item.answer.id === item.node.answers[i].id) {
                    index = i;
                }
            }

            item.node.answers = Util.arrayMove(item.node.answers, index, index - 1);

            for (let i = 0; i < item.node.answers.length; i++) {
                item.node.answers[i].order = i;
            }

            item.intent.save();
        });

        vscode.commands.registerCommand('answer.moveDown', async (item: AnswerItem) => {
            if (!item) { return; }

            let index = 0;

            for (let i = 0; i < item.node.answers.length; i++) {
                if (item.answer.id === item.node.answers[i].id) {
                    index = i;
                }
            }

            item.node.answers = Util.arrayMove(item.node.answers, index, index + 1);

            for (let i = 0; i < item.node.answers.length; i++) {
                item.node.answers[i].order = i;
            }

            item.intent.save();
        });

        vscode.commands.registerCommand('answer.delete', async (item: AnswerItem) => {
            if (!item) { return; }
            let confirm = await vscode.window.showInformationMessage(
                `Are you sure you want to delete "${item.answer.name}"?`,
                { modal: true }, 'Delete'
            );
            if (!confirm) { return; }

            let node = item.node;

            let answers: PrismNodeAnswer[] = [];
            for (let i = 0; i < node.answers.length; i++) {
                if (node.answers[i].id !== item.answer.id) {
                    answers.push(node.answers[i]);
                }
            }
            node.answers = answers;
            item.intent.save();
        });
        /** End Answers */
    }
}
