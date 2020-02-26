import {graph, parse} from 'rdflib';
import fs from "fs-extra";

const MIME_TYPE = 'text/turtle';

export class TurtleFile {

    constructor({location}) {
        this.location = location;
        this.graph = graph();
    }

    read() {
        const body = fs.readFileSync(this.location, 'utf-8');
        parse(body, this.graph, this.location, MIME_TYPE);
        return this;
    }
}