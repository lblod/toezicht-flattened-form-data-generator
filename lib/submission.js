import {sparqlEscapeUri} from 'mu';
import {querySudo as query} from '@lblod/mu-auth-sudo';
import {TurtleFile} from "./turtle-file";

export const SUBMISSION_SENT_STATUS = 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c';

export class Submission {
    constructor({uri, ttlPath}) {
        this.uri = uri;
        this.ttlPath = ttlPath;
    }

    // TODO make this infinite loop safe
    async load(){
        if(this.ttlPath) {
            this.ttl = await new TurtleFile({location: this.ttlPath}).read();
        } else {
            await this.buildByTask(this.uri);
            this.load();
        }
        return this;
    }

    async buildByTask(uri) {

        const q = `
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX melding: <http://lblod.data.gift/vocabularies/automatische-melding/>
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?ttlFile ?submittedResource
WHERE {
    ${sparqlEscapeUri(uri)} dct:subject ?submittedResource .
    ?submittedResource dct:source ?ttlFile .
    ?ttlFile dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
  }
} LIMIT 1
  `;

        const result = await query(q);

        if (result.results.bindings.length) {
            const binding = result.results.bindings[0];
            this.ttlPath = binding['ttlFile'].value.replace('share://', '/share/');
        } else {
            throw `Could not build submission for task with uri <${uri}>`
        }
        return this;
    }
}

