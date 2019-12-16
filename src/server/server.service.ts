import { v4 as uuid } from 'uuid';
import { Util } from '../util';
import { PrismServer } from './server';
import { PrismServerCommands } from './server.commands';

let varInstance: PrismServerService;

export class PrismServerService {
    static instance(): PrismServerService {
        if (!varInstance) {
            varInstance = new PrismServerService();
            PrismServerCommands.setup();
        }
        return varInstance;
    }
    private servers: PrismServer[] = [];

    reload() {
        if (!Util.context) {
            this.servers = [];
            return Util.serversChanged.next([]);
        }

        let items: PrismServer[] = [];
        try {
            let data: any = Util.context.workspaceState.get('servers');
            for (let i = 0; i < data.length; i++) {
                let server = new PrismServer();
                Object.assign(server, data[i]);
                if (server.id) {
                    items.push(server);
                }
            }
        } catch (err) { }
        this.servers = items;
        Util.serversChanged.next(this.servers);
    }

    list(): PrismServer[] {
        return this.servers;
    }

    save() {
        if (!Util.context) { return; }
        this.servers.sort((a, b) => {
            return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        });
        Util.context.workspaceState.update('servers', this.servers);
        this.reload();
    }

    setServers(servers: PrismServer[]) {
        this.servers = servers;
        this.save();
    }
}
