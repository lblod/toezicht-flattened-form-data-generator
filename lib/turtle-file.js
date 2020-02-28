import {graph, parse} from 'rdflib';
import fs from "fs-extra";

const MIME_TYPE = 'text/turtle';

export class TurtleFile {

    get uri() {
        if(this.id) {
            return this.id;
        }
        return `http://${this.location}`;
    }

    constructor({uri, location}) {
        // TODO could this be named better;
        this.id = uri;
        this.location = location;
    }

    // TODO make exception proof
    read() {
        this.graph = graph();
        const body = fs.readFileSync(this.location, 'utf-8');
        parse(body, this.graph, this.uri , MIME_TYPE);
        return this;
    }
}