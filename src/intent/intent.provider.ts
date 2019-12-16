import * as vscode from 'vscode';
import * as path from 'path';
import { PrismIntent, PrismIntentUtterance, PrismIntentTrigger } from './intent';
import { PrismBotService } from '../bot/bot.service';
import { Util } from '../util';
import { PrismNode, NodeTypes, PrismNodeAnswer, PrismNodeState } from '../node/node';

export class IntentsProvider implements vscode.TreeDataProvider<any> {

    // tslint:disable-next-line: variable-name
    private _onDidChangeTreeData: vscode.EventEmitter<any | undefined> = new vscode.EventEmitter<any | undefined>();
    // tslint:disable-next-line: member-ordering
    readonly onDidChangeTreeData: vscode.Event<any | undefined> = this._onDidChangeTreeData.event;
    private intents: PrismIntent[] = [];

    constructor() {
        Util.intentsChanged.subscribe({
            next: (intents: PrismIntent[]) => {
                this.intents = intents;
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
            case 'nodes':
            case 'states':
            case 'answers':
                return new IntentItem(element.intent);
            case 'node':
                return new NodesItem(element.intent);
            case 'state':
                return new StatesItem(element.intent, element.node);
            case 'answer':
                return new AnswersItem(element.intent, element.node);
        }
        return null;
    }

    getChildren(element?: any): Thenable<any[]> {
        let children: any[] = [];
        let indicateNone: boolean = false;

        if (!element) {
            for (let i = 0; i < this.intents.length; i++) {
                children.push(new IntentItem(this.intents[i]));
            }
            indicateNone = true;
        } else if (element.contextValue === 'intent') {
            let intent: PrismIntent = element.intent;
            children.push(new TriggersItem(intent));
            children.push(new UtterancesItem(intent));
            children.push(new NodesItem(intent));
        } else if (element.contextValue === 'triggers') {
            let intent: PrismIntent = element.intent;
            for (let i = 0; i < intent.triggers.length; i++) {
                children.push(new TriggerItem(intent, intent.triggers[i]));
            }
        } else if (element.contextValue === 'utterances') {
            let intent: PrismIntent = element.intent;
            for (let i = 0; i < intent.utterances.length; i++) {
                children.push(new UtteranceItem(intent, intent.utterances[i]));
            }
        } else if (element.contextValue === 'nodes') {
            let intent: PrismIntent = element.intent;
            for (let i = 0; i < intent.nodes.length; i++) {
                children.push(new NodeItem(intent, intent.nodes[i]));
            }
        } else if (element.contextValue === 'node') {
            let intent: PrismIntent = element.intent;
            let node: PrismNode = element.node;
            if (node.isMultipleChoice()) {
                children.push(new AnswersItem(intent, node));
            }
            children.push(new StatesItem(intent, node));
        } else if (element.contextValue === 'answers') {
            let node: PrismNode = element.node;
            for (let i = 0; i < node.answers.length; i++) {
                children.push(new AnswerItem(element.intent, node, node.answers[i]));
            }
        } else if (element.contextValue === 'states') {
            let node: PrismNode = element.node;
            for (let i = 0; i < node.states.length; i++) {
                children.push(new StateItem(element.intent, node, node.states[i]));
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

export class IntentItem extends vscode.TreeItem {
    public contextValue = 'intent';
    public intent: PrismIntent;

    constructor(intent: PrismIntent) {
        super(intent.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.intent = intent;
        this.id = `${intent.id}`;
        this.tooltip = intent.folder;

        this.command = {
            command: 'intent.open',
            title: '',
            arguments: [this]
        };

        let descriptions: string[] = [];

        let defaultNodeFound = false;
        for (let i = 0; i < intent.nodes.length; i++) {
            if (intent.nodes[i].id === intent.defaultNodeId) {
                defaultNodeFound = true;
            }
        }

        if (!defaultNodeFound) {
            descriptions.push('[ Missing Default Node ]');
        }

        if (!intent.isEnabled) {
            descriptions.push('[ Disabled ]');
        }

        if (Util.currentBot) {
            if (Util.currentBot.defaultIntentId === this.intent.id) {
                descriptions.push('[ Default ]');
            }
            if (Util.currentBot.triggerOnJoinIntentId === this.intent.id) {
                descriptions.push('[ Trigger ]');
            }
        }
        this.description = descriptions.join(' ');
    }
}

export class UtteranceItem extends vscode.TreeItem {
    public contextValue = 'utterance';
    public intent: PrismIntent;
    public utterance: PrismIntentUtterance;

    constructor(intent: PrismIntent, utterance: PrismIntentUtterance) {
        super(utterance.name, vscode.TreeItemCollapsibleState.None);
        this.intent = intent;
        this.utterance = utterance;
        this.id = `${intent.id}/utterances/${utterance.id}`;
        this.tooltip = utterance.id;
    }
}

export class TriggersItem extends vscode.TreeItem {
    public contextValue = 'triggers';
    public intent: PrismIntent;

    constructor(intent: PrismIntent) {
        super('Triggers', vscode.TreeItemCollapsibleState.Collapsed);
        this.intent = intent;
        this.id = `${intent.id}/triggers`;
        this.description = `${intent.triggers.length}`;

        if (intent.triggers.length === 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
    }
}

export class TriggerItem extends vscode.TreeItem {
    public contextValue = 'trigger';
    public intent: PrismIntent;
    public trigger: PrismIntentTrigger;

    constructor(intent: PrismIntent, trigger: PrismIntentTrigger) {
        super(trigger.name, vscode.TreeItemCollapsibleState.None);
        this.intent = intent;
        this.trigger = trigger;
        this.id = `${intent.id}/triggers/${trigger.id}`;
        this.tooltip = trigger.id;
    }
}

export class UtterancesItem extends vscode.TreeItem {
    public contextValue = 'utterances';
    public intent: PrismIntent;

    constructor(intent: PrismIntent) {
        super('Utterances', vscode.TreeItemCollapsibleState.Collapsed);
        this.intent = intent;
        this.id = `${intent.id}/utterances`;
        this.description = `${intent.utterances.length}`;

        if (intent.utterances.length === 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
    }
}

export class AnswersItem extends vscode.TreeItem {
    public contextValue = 'answers';
    public intent: PrismIntent;
    public node: PrismNode;

    constructor(intent: PrismIntent, node: PrismNode) {
        super('Answers', vscode.TreeItemCollapsibleState.Collapsed);
        this.intent = intent;
        this.node = node;
        this.id = `${intent.id}/nodes/${node.id}/answers`;

        if (node.answers.length === 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        this.description = `${node.answers.length}`;
    }
}

export class AnswerItem extends vscode.TreeItem {
    public contextValue = 'answer';
    public intent: PrismIntent;
    public node: PrismNode;
    public answer: PrismNodeAnswer;

    constructor(intent: PrismIntent, node: PrismNode, answer: PrismNodeAnswer) {
        super(answer.name, vscode.TreeItemCollapsibleState.None);
        this.intent = intent;
        this.node = node;
        this.answer = answer;
        this.id = `${intent.id}/nodes/${node.id}/answers/${answer.id}`;
        this.tooltip = answer.id;

        this.command = {
            command: 'node.open',
            title: '',
            arguments: [new NodeItem(this.intent, this.node)]
        };
    }
}

export class StatesItem extends vscode.TreeItem {
    public contextValue = 'states';
    public intent: PrismIntent;
    public node: PrismNode;

    constructor(intent: PrismIntent, node: PrismNode) {
        super('States', vscode.TreeItemCollapsibleState.Collapsed);
        this.intent = intent;
        this.node = node;
        this.id = `${intent.id}/nodes/${node.id}/states`;

        if (node.states.length === 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        this.description = `${node.states.length}`;
    }
}

export class StateItem extends vscode.TreeItem {
    public contextValue = 'state';
    public intent: PrismIntent;
    public node: PrismNode;
    public state: PrismNodeState;

    constructor(intent: PrismIntent, node: PrismNode, state: PrismNodeState) {
        super(state.name, vscode.TreeItemCollapsibleState.None);
        this.intent = intent;
        this.node = node;
        this.state = state;
        this.id = `${intent.id}/nodes/${node.id}/states/${state.id}`;
        this.tooltip = state.id;

        this.command = {
            command: 'node.open',
            title: '',
            arguments: [new NodeItem(this.intent, this.node)]
        };
    }
}

export class NodesItem extends vscode.TreeItem {
    public contextValue = 'nodes';
    public intent: PrismIntent;

    constructor(intent: PrismIntent) {
        super('Nodes', vscode.TreeItemCollapsibleState.Collapsed);
        this.intent = intent;
        this.id = `${intent.id}/nodes`;
        this.description = `${intent.nodes.length}`;
    }
}

export class NodeItem extends vscode.TreeItem {
    public contextValue = 'node';
    public intent: PrismIntent;
    public node: PrismNode;

    constructor(intent: PrismIntent, node: PrismNode) {
        super('Node', vscode.TreeItemCollapsibleState.Collapsed);
        this.intent = intent;
        this.node = node;
        this.id = `${intent.id}/nodes/${node.id}`;
        this.tooltip = node.id;

        this.label = NodeTypes.types[node.type] || 'N/A'; // just incase
        let descriptions: string[] = [];

        if (node.text) {
            descriptions.push(node.text);
        }

        if (node.variable) {
            descriptions.push(`[ ${node.variable} ]`);
        }

        if (node.id === intent.defaultNodeId) {
            descriptions.push(`[Default]`);
        }

        this.description = descriptions.join(' ');

        this.command = {
            command: 'node.open',
            title: '',
            arguments: [this]
        };
    }
}
