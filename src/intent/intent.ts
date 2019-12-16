import { Util } from '../util';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { PrismNode } from '../node/node';
import { PrismIntentService } from './intent.service';

export class PrismIntentTrigger {
    id!: string;
    name!: string;

    // tslint:disable-next-line: member-ordering
    static create(name: string): PrismIntentTrigger {
        let item = new PrismIntentTrigger();
        item.id = uuid();
        item.name = name;
        return item;
    }
}

export class PrismIntentUtterance {
    id!: string;
    name!: string;

    // tslint:disable-next-line: member-ordering
    static create(name: string): PrismIntentUtterance {
        let item = new PrismIntentUtterance();
        item.id = uuid();
        item.name = name;
        return item;
    }
}

export class PrismIntent {
    id!: string;
    name!: string;
    triggers!: PrismIntentTrigger[];
    utterances!: PrismIntentUtterance[];
    nodes!: PrismNode[];
    isEnabled!: boolean;
    folder!: string;
    defaultNodeId!: string;

    save() {
        if (!this.folder) { return; }
        this.normalize();
        Util.ensurePath(this.folder);
        Util.saveJSON(path.join(this.folder, 'data.json'), {
            id: this.id,
            name: this.name,
            isEnabled: this.isEnabled,
            defaultNodeId: this.defaultNodeId,
            triggers: this.triggers,
            utterances: this.utterances,
            nodes: this.nodes
        });

        PrismIntentService.instance().reloadCurrent();
    }

    normalize() {
        let triggers: PrismIntentTrigger[] = [];
        try {
            for (let i = 0; i < this.triggers.length; i++) {
                let trigger = new PrismIntentTrigger();
                Object.assign(trigger, this.triggers[i]);
                triggers.push(trigger);
            }
        } catch (err) { }

        this.triggers = triggers;

        let utterances: PrismIntentUtterance[] = [];
        try {
            for (let i = 0; i < this.utterances.length; i++) {
                let utterance = new PrismIntentUtterance();
                Object.assign(utterance, this.utterances[i]);
                utterances.push(utterance);
            }
        } catch (err) { }

        this.utterances = utterances;

        let nodes: PrismNode[] = [];
        try {
            for (let i = 0; i < this.nodes.length; i++) {
                let node = new PrismNode();
                Object.assign(node, this.nodes[i]);
                node.normalize();
                nodes.push(node);
            }
        } catch (err) { }

        this.nodes = nodes;

        this.triggers.sort((a, b) => {
            return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });

        this.utterances.sort((a, b) => {
            return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });

        this.nodes.sort((a, b) => {
            if (
                a.top !== undefined && b.top !== undefined
                && a.left !== undefined && b.left !== undefined
            ) {
                return a.top - b.top || a.left - b.left;
            }
            return 0;
        });
    }

    // tslint:disable-next-line: member-ordering
    static create(name: string): PrismIntent {
        let intent = new PrismIntent();
        intent.id = uuid();
        intent.name = name;
        intent.isEnabled = true;

        intent.normalize(); // normalize so nodes array is set

        let node = PrismNode.create({
            type: 'start',
            text: 'default',
            top: 20,
            left: 20
        });

        intent.defaultNodeId = node.id;

        intent.nodes.push(node);
        return intent;
    }
}
