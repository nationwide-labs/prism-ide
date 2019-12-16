import { PrismNode, NodeTypes } from '../node/node';
import { WebviewPanel } from 'vscode';
import * as path from 'path';
import { Util } from '../util';
import * as vscode from 'vscode';
import { PrismIntent } from './intent';
import { PrismIntentService } from './intent.service';
import { NodesItem, NodeItem } from './intent.provider';
import { NodeService } from '../node/node.service';
import { utils } from 'mocha';

let varInstance: FlowPanel;

export class FlowPanel {
    static instance(): FlowPanel {
        if (!varInstance) {
            varInstance = new FlowPanel();
        }
        return varInstance;
    }

    private panel: WebviewPanel | undefined;
    private intent: PrismIntent | undefined;
    private nodeService: NodeService;

    constructor() {
        this.nodeService = NodeService.instance();

        Util.intentsChanged.subscribe({
            next: (intents: PrismIntent[]) => {
                if (this.panel) {
                    let found = false;
                    if (this.intent) {
                        for (let i = 0; i < intents.length; i++) {
                            if (intents[i].id === this.intent.id) {
                                this.intent = intents[i];
                                found = true;
                            }
                        }
                    }
                    if (!found) {
                        this.intent = undefined;
                    }
                    this.show();
                    this.refreshData();
                }
            }
        });
    }

    setIntent(intent: PrismIntent) {
        this.intent = intent;
        this.show();
        this.refreshData();
    }

    scrollToNode(node: PrismNode, select: boolean) {
        if (!this.panel) { return; }
        this.panel.webview.postMessage({
            command: 'node.scroll',
            id: node.id,
            select: select
        });
    }

    show() {
        if (!Util.context) {
            return;
        }

        if (this.panel) {
            try {
                this.panel.reveal();
            } catch (err) {
                this.panel = undefined;
            }
        }

        if (!this.panel) {
            this.panel = vscode.window.createWebviewPanel('flow', '', vscode.ViewColumn.One, {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(Util.context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(Util.context.extensionPath, 'node_modules'))
                ]
            });
            this.panel.webview.html = this.getWebviewContent();

            this.panel.webview.onDidReceiveMessage((message) => {
                if (!this.intent) { return; }

                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        break;
                    case 'refresh':
                        this.refreshData();
                        break;
                    case 'node.add':
                        this.addNode(message.data);
                        break;
                    case 'node.name':
                        this.nodeService.editName(this.intent, message.id);
                        break;
                    case 'node.default':
                        this.nodeService.setDefaultStart(this.intent, message.id);
                        break;
                    case 'node.prompt':
                        this.nodeService.editPrompt(this.intent, message.id);
                        break;
                    case 'node.text':
                        this.nodeService.editText(this.intent, message.id);
                        break;
                    case 'node.variable':
                        this.nodeService.editVariable(this.intent, message.id);
                        break;
                    case 'node.code.before':
                        this.nodeService.editCodeBefore(this.intent, message.id);
                        break;
                    case 'node.toggle.before':
                        this.nodeService.toggleCodeBefore(this.intent, message.id);
                        break;
                    case 'node.code.after':
                        this.nodeService.editCodeAfter(this.intent, message.id);
                        break;
                    case 'node.toggle.after':
                        this.nodeService.toggleCodeAfter(this.intent, message.id);
                        break;
                    case 'node.move':
                        this.nodeService.move(this.intent, message.id, message.top, message.left);
                        break;
                    case 'node.delete':
                        this.nodeService.delete(this.intent, message.id);
                        break;
                    case 'node.link':
                        this.nodeService.link(this.intent, message.linkData);
                        break;
                    case 'node.open':
                        this.treeOpenNode(message.id);
                        break;
                    case 'node.link.delete':
                        this.nodeLinkDelete(message.linkId);
                        break;
                    case 'node.reference':
                        this.nodeService.editReference(this.intent, message.id);
                        break;
                    case 'node.answer.add':
                        this.nodeService.addAnswer(this.intent, message.id);
                        break;
                    case 'node.state.add':
                        this.nodeService.addState(this.intent, message.id);
                        break;
                }
            });
        }

        if (this.intent) {
            this.panel.title = `${this.intent.name}`;
        }
    }

    async nodeLinkDelete(linkId: string) {
        if (!this.intent) { return; }
        let parts = linkId.split('.');
        let node = this.nodeService.findById(this.intent, parts[2]);
        if (!node) { return; }

        let confirm = await vscode.window.showInformationMessage(`Are you sure you want to delete this link?`,
            { modal: true }, 'Delete'
        );
        if (!confirm) { return; }
        if (parts[0] === 'state') {
            let state = this.nodeService.findStateById(node, parts[3]);
            if (state) {
                state.nextNodeId = undefined;
            }
        } else if (parts[0] === 'answer') {
            let answer = this.nodeService.findAnswerById(node, parts[3]);
            if (answer) {
                answer.nextNodeId = undefined;
            }
        } else if (parts[0] === 'default') {
            node.defaultNodeId = undefined;
        }
        this.intent.save();
    }

    treeOpenNode(id: string) {
        let tree = Util.intentsTree;
        if (!tree) { return; }

        if (!this.intent) { return; }
        let node = this.nodeService.findById(this.intent, id);
        if (!node) {
            return tree.reveal(new NodesItem(this.intent));
        }

        let nodeItem = new NodeItem(this.intent, node);
        tree.reveal(nodeItem);
    }

    addNode(data: any) {
        if (!this.intent) { return; }
        this.intent.nodes.push(PrismNode.create({
            type: data.type,
            top: data.top,
            left: data.left
        }));
        this.intent.save();
    }

    async refreshData() {
        if (!this.panel) {
            return;
        }

        if (!this.intent) {
            return;
        }

        this.panel.webview.postMessage({
            nodes: this.intent.nodes,
            flowchart: this.getData(this.intent, [])
        });
    }

    nodeField(label: any, value: any) {
        return '<div class="node-field">' +
            '<div class="node-field-label">' +
            label +
            '</div>' +
            '<div class="node-field-value">' +
            (value === undefined ? '-- blank --' : value) +
            '</div>' +
            '</div>';
    }

    nodeToOperator(intent: PrismIntent, node: PrismNode) {
        let body = '';

        switch (node.type) {
            case 'start':
                body += this.nodeField('Name', node.text);
                break;
            case 'input.multipleChoice':
            case 'input.yesNo':
            case 'input.number':
            case 'input.date':
            case 'input.text':
                body += this.nodeField('Prompt', node.text);
                break;
            case 'output.text':
                body += this.nodeField('Text', node.text);
                break;
            case 'reference':
                if (node.referenceIntentId && Util.currentBot) {
                    let intentObj: PrismIntent | undefined = PrismIntentService.instance().findById(
                        Util.currentBot, node.referenceIntentId
                    );

                    let nodeObj: PrismNode | undefined;

                    if (intentObj && node.referenceNodeId) {
                        nodeObj = NodeService.instance().findById(intentObj, node.referenceNodeId);
                    }

                    body += this.nodeField('Intent', intentObj ? (intentObj.name || ' -- No Name --') : '');
                    body += this.nodeField('Node', nodeObj ? (nodeObj.text || ' -- No Name --') : '');
                }
                break;
            case 'plain':
                break;
        }

        if (node.type.startsWith('input.') && node.variable) {
            body += this.nodeField('Variable', node.variable);
        }

        if (node.isCodeBeforeEnabled) {
            body += '<div class="beforeCode"></div>';
        }

        if (node.isCodeAfterEnabled) {
            body += '<div class="afterCode"></div>';
        }

        return `
    <div class="node-body">
    <div class="node-type">
        <span>${node.id === intent.defaultNodeId ? '[Default] ' : ''}${NodeTypes.types[node.type]}</span>
    </div>${body}</div>
    `;
    }

    getData(intent: PrismIntent, intents: PrismIntent[]) {
        let nodes = intent.nodes;

        let nodeMap: { [key: string]: PrismNode } = {};
        for (let i = 0; i < nodes.length; i++) {
            nodeMap[nodes[i].id] = nodes[i];
        }

        let operators: {
            [key: string]: any
        } = {};

        let links: {
            [key: string]: any
        } = {};

        for (let ni = 0; ni < nodes.length; ni++) {
            let node = nodes[ni];

            operators[node.id] = {};

            let operator = operators[node.id];

            operator.node = node;
            operator.top = node.top || 0;
            operator.left = node.left || 0;

            operator.properties = {
                inputs: {
                    in: {
                        label: 'In'
                    }
                },
                outputs: {}
            };

            operator.properties.title = this.nodeToOperator(intent, node);

            // Answers
            if (node.answers) {
                for (let i = 0; i < node.answers.length; i++) {
                    let answer = node.answers[i];
                    if (answer) {
                        operator.properties.outputs[`answer.${i}.${node.id}.${answer.id}`] = {
                            label: 'Answer - ' + answer.name
                        };

                        if (answer.nextNodeId && nodeMap[answer.nextNodeId]) {
                            links[`answer.${i}.${node.id}.${answer.id}`] = {
                                fromOperator: node.id,
                                fromConnector: `answer.${i}.${node.id}.${answer.id}`,
                                toOperator: answer.nextNodeId,
                                toConnector: 'in',
                                answer: answer
                            };
                        }
                    }
                }
            }

            // States
            if (node.states) {
                for (let i = 0; i < node.states.length; i++) {
                    let state = node.states[i];
                    if (state) {
                        operator.properties.outputs[`state.${i}.${node.id}.${state.id}`] = {
                            label: 'State - ' + state.name
                        };
                        if (state.nextNodeId && nodeMap[state.nextNodeId]) {
                            links[`state.${i}.${node.id}.${state.id}`] = {
                                fromOperator: node.id,
                                fromConnector: `state.${i}.${node.id}.${state.id}`,
                                toOperator: state.nextNodeId,
                                toConnector: 'in',
                                state: state
                            };
                        }
                    }
                }
            }

            if (node.type !== 'reference' && node.type !== 'input.yesNo') {
                // Default out
                operator.properties.outputs[`default.0.${node.id}`] = {
                    label: 'Default Next'
                };

                if (node.defaultNodeId && nodeMap[node.defaultNodeId]) {
                    links[`default.0.${node.id}`] = {
                        fromOperator: node.id,
                        fromConnector: `default.0.${node.id}`,
                        toOperator: node.defaultNodeId,
                        toConnector: 'in'
                    };
                }
            }
        }

        return {
            links: links,
            operators: operators
        };
    }

    pathToScript(dir: string) {
        if (!this.panel) {
            return undefined;
        }
        return this.panel.webview.asWebviewUri(vscode.Uri.file(dir));
    }

    getWebviewContent(): string {
        let panel = this.panel;
        let context = Util.context;
        if (!(panel && context)) {
            return '';
        }

        let jqueryScript = this.pathToScript(path.join(context.extensionPath, 'node_modules', 'jquery', 'dist', 'jquery.min.js'));
        let jqueryuiScript = this.pathToScript(path.join(context.extensionPath, 'node_modules', 'jquery-ui-dist', 'jquery-ui.min.js'));
        let flowchartScript = this.pathToScript(path.join(context.extensionPath, 'media', 'assets', 'jquery.flowchart', 'jquery.flowchart.js'));
        let contextMenuScript = this.pathToScript(path.join(context.extensionPath, 'node_modules', 'jquery-contextmenu', 'dist', 'jquery.contextMenu.min.js'));
        let flow = this.pathToScript(path.join(context.extensionPath, 'media', 'assets', 'flow.js'));
        let flowchartCss = this.pathToScript(
            path.join(context.extensionPath, 'media', 'assets', 'jquery.flowchart', 'jquery.flowchart.css')
        );
        let contextMenuCss = this.pathToScript(path.join(context.extensionPath, 'node_modules', 'jquery-contextmenu', 'dist', 'jquery.contextMenu.min.css'));
        let flowCSS = this.pathToScript(path.join(context.extensionPath, 'media', 'assets', 'flow.css'));

        const nonce = this.getNonce();

        return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta
http-equiv="Content-Security-Policy" img-src ${panel.webview.cspSource} https:; script-src ${panel.webview.cspSource}; style-src ${panel.webview.cspSource};"
/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cat Coding</title>
  </head>
  <body>
  <script nonce="${nonce}" src="${jqueryScript}"></script>
  <script nonce="${nonce}" src="${jqueryuiScript}"></script>
  <script nonce="${nonce}" src="${flowchartScript}"></script>
  <script nonce="${nonce}" src="${contextMenuScript}"></script>
  <script nonce="${nonce}" src="${flow}"></script>
  <link nonce="${nonce}" rel="stylesheet" href="${flowchartCss}">
  <link nonce="${nonce}" rel="stylesheet" href="${contextMenuCss}">
  <link nonce="${nonce}" rel="stylesheet" href="${flowCSS}">
  <div class="flow-container">
    <div id="flowchart"></div>
  </div>
  </body>
  </html>`;
    }

    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
