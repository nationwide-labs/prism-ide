import { v4 as uuid } from 'uuid';

export class PrismNodeState {
    id!: string;
    name!: string;
    nextNodeId?: string;

    // tslint:disable-next-line: member-ordering
    static create(name: string): PrismNodeState {
        let item = new PrismNodeState();
        item.id = uuid();
        item.name = name;
        return item;
    }
}

export class PrismNodeAnswer {
    id!: string;
    name!: string;
    nextNodeId?: string;
    order!: number;

    // tslint:disable-next-line: member-ordering
    static create(name: string): PrismNodeAnswer {
        let item = new PrismNodeAnswer();
        item.id = uuid();
        item.name = name;
        item.order = 0;
        return item;
    }
}

export class NodeTypes {
    public static types: { [key: string]: string } = {
        'input.multipleChoice': 'Input: Multiple Choice',
        'input.yesNo': 'Input: Yes/No',
        'input.number': 'Input: Number',
        'input.date': 'Input: Date',
        'input.text': 'Input: Text',
        'output.text': 'Output: Text',
        // tslint:disable-next-line: object-literal-key-quotes
        'start': 'Start',
        // tslint:disable-next-line: object-literal-key-quotes
        'reference': 'Reference',
        // tslint:disable-next-line: object-literal-key-quotes
        'plain': 'Plain'
    };
}

export class PrismNode {
    id!: string;
    type!: string;
    variable?: string;
    top!: number;
    left!: number;
    states!: PrismNodeState[];
    answers!: PrismNodeAnswer[];
    defaultNodeId?: string;
    text?: string;
    referenceIntentId?: string;
    referenceNodeId?: string;

    codeBeforeFile!: string;
    codeAfterFile!: string;

    isCodeBeforeEnabled!: boolean;
    isCodeAfterEnabled!: boolean;

    isInput() {
        return this.type && this.type.startsWith('input.');
    }

    isMultipleChoice() {
        return this.type && this.type === 'input.multipleChoice';
    }

    isOutput() {
        return this.type && this.type.startsWith('output.');
    }

    isReference() {
        return this.type === 'reference';
    }

    isStart() {
        return this.type === 'start';
    }

    isPlain() {
        return this.type === 'plain';
    }

    normalize() {
        let states: PrismNodeState[] = [];
        try {
            for (let i = 0; i < this.states.length; i++) {
                let state = new PrismNodeState();
                Object.assign(state, this.states[i]);
                states.push(state);
            }
        } catch (err) { }

        let answers: PrismNodeAnswer[] = [];
        try {
            for (let i = 0; i < this.answers.length; i++) {
                let answer = new PrismNodeAnswer();
                Object.assign(answer, this.answers[i]);
                answers.push(answer);
            }
        } catch (err) { }

        answers.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                if (a.order > b.order) {
                    return 1;
                } else if (a.order < b.order) {
                    return -1;
                }
            }
            return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });

        states.sort((a, b) => {
            return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });

        this.answers = answers;
        this.states = states;
    }

    // tslint:disable-next-line: member-ordering
    static create(data: {
        type: string;
        top: any;
        left: any;
        text?: string;
    }): PrismNode {
        let node = new PrismNode();
        node.id = uuid();
        node.top = 0;
        node.left = 0;

        Object.assign(node, data);
        if (node.type === 'input.yesNo') {
            let yes = new PrismNodeAnswer();
            yes.id = uuid();
            yes.name = 'Yes';
            let no = new PrismNodeAnswer();
            no.id = uuid();
            no.name = 'No';
            node.answers = [yes, no];
        }

        if (data.text !== undefined) {
            node.text = data.text;
        }

        node.normalize();

        return node;
    }
}
