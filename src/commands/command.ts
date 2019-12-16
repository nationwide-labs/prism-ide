import { Util } from '../util';
import * as path from 'path';
import { CommandService } from './command.service';
import { v4 as uuid } from 'uuid';

export class PrismCommand {
    id!: string;
    name!: string;
    description!: string;
    options!: PrismCommandOption[];
    isEnabled!: boolean;
    isHelpEnabled!: boolean;

    folder!: string;
    codeFile!: string;

    normalize() {
        let options: PrismCommandOption[] = [];
        try {
            for (let i = 0; i < this.options.length; i++) {
                let option = new PrismCommandOption();
                Object.assign(option, this.options[i]);
                options.push(option);
            }
        } catch (err) { }
        this.options = options;
    }

    save() {
        if (!this.folder) { return; }
        this.normalize();
        Util.ensurePath(this.folder);
        Util.saveJSON(path.join(this.folder, 'data.json'), {
            id: this.id,
            name: this.name,
            description: this.description,
            options: this.options,
            isEnabled: this.isEnabled,
            isHelpEnabled: this.isHelpEnabled
        });
        CommandService.instance().reloadCurrent();
    }

    // tslint:disable-next-line: member-ordering
    static create(name: string): PrismCommand {
        let command = new PrismCommand();
        command.id = uuid();
        command.name = name;
        command.isEnabled = true;
        command.isHelpEnabled = true;
        command.normalize();
        return command;
    }
}

export class PrismCommandOption {
    id!: string;
    flags!: string;
    description!: string;
    defaultValue!: string;

    // tslint:disable-next-line: member-ordering
    static create(flags: string): PrismCommandOption {
        let option = new PrismCommandOption();
        option.id = uuid();
        option.flags = flags;
        return option;
    }
}
