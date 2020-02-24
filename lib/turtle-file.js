import {graph, parse} from 'rdflib';
import fs from "fs-extra";

// TODO name this to the ttl file
const URI = 'https://example.org/resource.ttl';
const MIME_TYPE = 'text/turtle';

export class TurtleFile {

    constructor() {
        this.graph = graph();
    }


    get triples() {
        return this.graph.statements;
    }

    read(path) {
        const body = fs.readFileSync(path, 'utf-8');
        parse(body, this.graph, URI, MIME_TYPE);
        return this;
    }
}