import { Util } from '../util';
import * as path from 'path';
import { PrismTaskService } from './task.service';
import { v4 as uuid } from 'uuid';

export class PrismTask {
    public id!: string;
    public name!: string;
    public schedule!: string;
    public isEnabled!: boolean;

    public codeFile!: string;
    public folder!: string;

    save() {
        if (!this.folder) { return; }
        Util.ensurePath(this.folder);
        Util.saveJSON(path.join(this.folder, 'data.json'), {
            id: this.id,
            name: this.name,
            schedule: this.schedule,
            isEnabled: this.isEnabled
        });
        PrismTaskService.instance().reloadCurrent();
    }

    // tslint:disable-next-line: member-ordering
    static create(name: string): PrismTask {
        let task = new PrismTask();
        task.id = uuid();
        task.name = name;
        task.isEnabled = true;
        return task;
    }
}
