import {sparqlEscapeUri} from 'mu';
import {querySudo as query} from '@lblod/mu-auth-sudo';
import {TurtleFile} from "./turtle-file";

export const SUBMISSION_SENT_STATUS = 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c';

export class Submission {

    constructor({uri, resourceURI, ttl}) {
        this.uri = uri;
        this.resourceURI = resourceURI;
        this.ttl = ttl;
    }
}


export async function createSubmissionByURI(uri) {

    // TODO add following check to the query  --> ?ttlFileURI dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
    // TODO move queries to seperate file.
    const q = `
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?ttlFileURI ?submittedResourceURI
WHERE {
  GRAPH ?g {
    ${sparqlEscapeUri(uri)} dct:subject ?submittedResourceURI .
    ?submittedResourceURI dct:source ?ttlFileURI .
  }
} LIMIT 1
  `;

    const result = await query(q);

    if (result.results.bindings.length) {
        const binding = result.results.bindings[0];
        return new Submission({
            uri,
            resourceURI: binding['submittedResourceURI'].value,
            ttl: await new TurtleFile({uri: binding['ttlFileURI'].value}).read()
        });
    } else {
        throw `Could not build submission for task with uri <${uri}>`
    }
}



