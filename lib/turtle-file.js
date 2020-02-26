import {graph, parse} from 'rdflib';
import fs from "fs-extra";

// TODO name this to the ttl file
const URI = 'https://example.org/resource.ttl';
const MIME_TYPE = 'text/turtle';

export class TurtleFile {

    constructor({location}) {
        this.location = location;
        this.graph = graph();
    }

    read() {
        const body = fs.readFileSync(this.location, 'utf-8');
        parse(body, this.graph, URI, MIME_TYPE);
        return this;
    }
}