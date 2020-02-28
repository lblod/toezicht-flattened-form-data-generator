import {sparqlEscapeUri} from 'mu';
import {querySudo as query} from '@lblod/mu-auth-sudo';
import {TurtleFile} from "./turtle-file";

export const SUBMISSION_SENT_STATUS = 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c';

export class Submission {

    constructor({uri, submittedDocument}) {
        this.uri = uri;
        this.submittedDocument = submittedDocument;
    }

    async load() {
        if (!this.submittedDocument) {
            await this.getSubmittedDocument();
        }
        await this.submittedDocument.read();
        return this;
    }

    async getSubmittedDocument() {

        // TODO add following check to the query  --> ?ttlFileURI dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
        const q = `
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?ttlFileURI ?submittedResourceURI
WHERE {
  GRAPH ?g {
    ${sparqlEscapeUri(this.uri)} dct:subject ?submittedResourceURI .
    ?submittedResourceURI dct:source ?ttlFileURI .
  }
} LIMIT 1
  `;

        const result = await query(q);

        if (result.results.bindings.length) {
            const binding = result.results.bindings[0];
            this.submittedDocument = new TurtleFile({
                uri: binding['submittedResourceURI'].value,
                location: binding['ttlFileURI'].value.replace('share://', '/share/')
            });
        } else {
            throw `Could not build submission for task with uri <${this.uri}>`
        }
        return this;
    }
}

