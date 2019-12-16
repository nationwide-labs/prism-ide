const vscode = acquireVsCodeApi();
let nodes = [];

let scrollNodeId;

window.addEventListener('message', (event) => {
    console.log('message');
    console.log(event);

    const message = event.data; // The JSON data our extension sent

    if (message.nodes) {
        nodes = message.nodes;
    }

    if (message.flowchart) {
        try {
            $('#flowchart').flowchart('setData', message.flowchart);
            $('#flowchart').flowchart('redrawLinksLayer');
            insertRightClick();
        } catch (err) {}
    }

    if (message.command) {
        switch (message.command) {
            case 'node.scroll':
                scrollNodeId = message.id;
                scrollToNode(scrollNodeId, message.select);
                break;
        }
    }
});

$(document).ready(function () {
    $('#flowchart').flowchart({
        data: {},
        multipleLinksOnInput: true,
        onOperatorMoved: (operatorId, position) => {
            console.log('onOperatorMoved ' + operatorId);
            if (!operatorId) {
                return;
            } // they tried dragging too fast?? 
            $('#flowchart').flowchart('selectOperator', operatorId);
            let node = findNodeById(operatorId);
            if (node && (node.top !== position.top || node.left !== position.left)) {
                vscode.postMessage({
                    command: 'node.move',
                    id: operatorId,
                    top: position.top,
                    left: position.left
                });
            }

            return true;
        },
        onLinkCreate: (linkId, linkData) => {
            console.log('onLinkCreate ' + linkId);
            if (isNaN(linkId)) {
                return true;
            } // means it was already created by drawing on now

            vscode.postMessage({
                command: 'node.link',
                linkData: linkData
            });
            return true;
        },
        onOperatorSelect: (operatorId) => {
            console.log('onoperatorselect ' + operatorId);
            // let node = this.idToNode(operatorId);
            // if ((!this.node) || (this.node && this.node.id !== node.id)) {
            //     this.nodeChanged.emit(node);
            // }
            vscode.postMessage({
                command: 'node.open',
                id: operatorId
            });
            return true;
        },
        onOperatorUnselect: () => {
            console.log('onOperatorUnselect');
            // if (this.node) {
            //     this.nodeChanged.emit(undefined);
            // }

            vscode.postMessage({
                command: 'node.open',
                id: undefined
            });
            return true;
        }
    });

    if (scrollNodeId) {
        scrollToNode(scrollNodeId, true);
    }
    // isReady = true;

    // vscode.postMessage({
    //     command: 'ready',
    //     text: '🐛  on line 1'
    // });
    vscode.postMessage({
        command: 'refresh'
    });
});

function triggerToNode(trigger) {
    return findNodeById(trigger.data('operator_id'));
}

function findNodeById(id) {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
            return nodes[i];
        }
    }
}

function nodeCommand(command, id) {
    vscode.postMessage({
        command: command,
        id: id
    });
}

function scrollToNode(id, select) {
    let node = findNodeById(id);
    if (!node) {
        return;
    }
    try {
        $('#flowchart').parent().clearQueue();
        if (select) {
            $('#flowchart').flowchart('selectOperator', node.id);
        }
        $('#flowchart').parent().animate({
            scrollTop: node.top - 20,
            scrollLeft: node.left - 20
        }, 1000);
    } catch (err) {
        console.log(err);
    }
    scrollNodeId = undefined;
}

function addNodeCallback(key, opt) {
    let menu = opt.$menu;
    let pos = menu.position();
    let parentOffset = opt.$trigger.offset();

    let relX = pos.left - parentOffset.left;
    let relY = pos.top - parentOffset.top;

    let body = {
        top: Math.floor(relY / 20) * 20,
        left: Math.floor(relX / 20) * 20,
        type: key
    };

    vscode.postMessage({
        command: 'node.add',
        data: body
    });
}

function insertRightClick() {
    try {
        $('.flowchart-operator').dblclick((e) => {
            let id = $(e.currentTarget).data('operator_id');
            scrollToNode(id, true);
        });

        $.contextMenu('destroy', '.flowchart-link');
        $.contextMenu('destroy', '.flowchart-operator');
        $.contextMenu('destroy', '.flowchart-container');


        $.contextMenu('destroy', '.flowchart-link');
        $.contextMenu('destroy', '.flowchart-operator');
        $.contextMenu('destroy', '.flowchart-container');

        $.contextMenu({
            selector: '.flowchart-link',
            items: {
                delete: {
                    name: 'Delete',
                    callback: (key, opt) => {
                        vscode.postMessage({
                            command: 'node.link.delete',
                            linkId: opt.$trigger.data('link_id')
                        });
                    }
                }
            },
            events: {
                hide: (options) => {
                    $('#flowchart').flowchart('unselectLink');
                    return true;
                }
            },
            build: ($trigger) => {
                $('#flowchart').flowchart('selectLink', $trigger.data('link_id'));
            }
        });

        $.contextMenu({
            selector: '.flowchart-operator',
            build: ($trigger, e) => {
                let node = triggerToNode($trigger);

                $('#flowchart').flowchart('selectOperator', node.id);

                let menu = {
                    items: {
                        startName: {
                            name: 'Edit Name',
                            callback: (key, opt) => {
                                nodeCommand('node.name', opt.$trigger.data('operator_id'));
                            },
                            visible: (key, opt) => {
                                return this.triggerToNode(opt.$trigger).type == 'start';
                            }
                        },
                        startDefault: {
                            name: 'Set Default',
                            callback: (key, opt) => {
                                nodeCommand('node.default', opt.$trigger.data('operator_id'));
                            },
                            visible: (key, opt) => {
                                return this.triggerToNode(opt.$trigger).type == 'start';
                            }
                        },
                        prompt: {
                            name: 'Edit Prompt',
                            callback: (key, opt) => {
                                nodeCommand('node.prompt', opt.$trigger.data('operator_id'));
                            },
                            visible: (key, opt) => {
                                return this.triggerToNode(opt.$trigger).type.startsWith('input.');
                            }
                        },
                        editText: {
                            name: 'Edit Text',
                            callback: (key, opt) => {
                                nodeCommand('node.text', opt.$trigger.data('operator_id'));
                            },
                            visible: (key, opt) => {
                                return this.triggerToNode(opt.$trigger).type === 'output.text';
                            }
                        },
                        referenceNode: {
                            name: 'Reference',
                            callback: (key, opt) => {
                                nodeCommand('node.reference', opt.$trigger.data('operator_id'));
                            },
                            visible: (key, opt) => {
                                return this.triggerToNode(opt.$trigger).type === 'reference';
                            }
                        },
                        addAnswer: {
                            name: 'New Answer',
                            callback: (key, opt) => {
                                nodeCommand('node.answer.add', opt.$trigger.data('operator_id'));
                            },
                            visible: (key, opt) => {
                                return this.triggerToNode(opt.$trigger).type === 'input.multipleChoice';
                            }
                        },
                        addState: {
                            name: 'New State',
                            callback: (key, opt) => {
                                nodeCommand('node.state.add', opt.$trigger.data('operator_id'));
                            }
                        },
                        variable: {
                            name: 'Edit Variable',
                            callback: (key, opt) => {
                                nodeCommand('node.variable', opt.$trigger.data('operator_id'));
                            },
                            visible: (key, opt) => {
                                return this.triggerToNode(opt.$trigger).type.startsWith('input.');
                            }
                        },
                        onBefore: {
                            name: 'Before Code',
                            items: {
                                edit: {
                                    name: 'Edit',
                                    callback: (key, opt) => {
                                        nodeCommand('node.code.before', opt.$trigger.data('operator_id'));
                                    }
                                },
                                enable: {
                                    name: 'Enable/Disable',
                                    callback: (key, opt) => {
                                        nodeCommand('node.toggle.before', opt.$trigger.data('operator_id'));
                                    }
                                }
                            }
                        },
                        onAfter: {
                            name: 'After Code',
                            items: {
                                edit: {
                                    name: 'Edit',
                                    callback: (key, opt) => {
                                        nodeCommand('node.code.after', opt.$trigger.data('operator_id'));
                                    }
                                },
                                enable: {
                                    name: 'Enable/Disable',
                                    callback: (key, opt) => {
                                        nodeCommand('node.toggle.after', opt.$trigger.data('operator_id'));
                                    }
                                }
                            }
                        },
                        delete: {
                            name: 'Delete',
                            callback: (key, opt) => {
                                nodeCommand('node.delete', opt.$trigger.data('operator_id'));
                            }
                        }
                    }
                };
                return menu;
            }
        });

        $.contextMenu({
            selector: '.flowchart-container',
            items: {
                input: {
                    name: 'New Input',
                    items: {
                        'input.date': {
                            name: 'Date',
                            callback: addNodeCallback
                        },
                        'input.multipleChoice': {
                            name: 'Multiple Choice',
                            callback: addNodeCallback
                        },
                        'input.number': {
                            name: 'Number',
                            callback: addNodeCallback
                        },
                        'input.text': {
                            name: 'Text',
                            callback: addNodeCallback
                        },
                        'input.yesNo': {
                            name: 'Yes/No',
                            callback: addNodeCallback
                        }
                    }
                },
                'output.text': {
                    name: 'New Output Text',
                    callback: addNodeCallback
                },
                plain: {
                    name: 'New Plain',
                    callback: addNodeCallback
                },
                start: {
                    name: 'New Start',
                    callback: addNodeCallback
                },
                reference: {
                    name: 'New Reference',
                    callback: addNodeCallback
                },
                refresh: {
                    name: 'Refresh',
                    callback: (key, opt) => {
                        vscode.postMessage({
                            command: 'refresh'
                        });
                    }
                }
            }
        });
    } catch (err) {
        console.log(err);
    }
}