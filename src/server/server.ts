import { v4 as uuid } from 'uuid';

export class PrismServer {
    id!: string;
    name!: string;
    url!: string;
    credentials!: string;

    // tslint:disable-next-line: member-ordering
    static create(name: string): PrismServer {
        let server = new PrismServer();
        server.name = name;
        server.id = uuid();
        return server;
    }
}
