import {uuid, sparqlEscapeUri, sparqlEscapeString} from 'mu';
import extractProperties from "./extractor";
import {MELDING, PROV} from "../util/namespaces";


export class FormData {

    get uri() {
        return `http://data.lblod.info/form-data/${this.uuid}`
    }

    constructor({submission}) {
        this.submission = submission;
        this.uuid = uuid();
        this.properties = [];
    }

    process() {
        // TODO change up param
        this.properties = extractProperties({
            graph: this.submission.ttl.graph,
            base: this.submission.subject
        });
        this.insert();
    }

    /**
     * will insert this "FormData" object into the triple store
     */
    insert() {
        console.log(this.properties);
        console.log("-- INSERTING FORM --");

        const q = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

INSERT {
  GRAPH ?g {
    ${sparqlEscapeUri(this.uri)} a ${sparqlEscapeUri(MELDING('FormData').value)}
    ${sparqlEscapeUri(this.uri)} mu:uuid ${sparqlEscapeString(this.uuid)}
    ${(this.properties.map(property => property.toNT(this.uri)).join('\n \t'))}
    ${sparqlEscapeUri(this.uri)} ${sparqlEscapeUri(PROV('hadPrimarySource').value)} ${sparqlEscapeString(this.submission.ttl.location)} .
    ${sparqlEscapeUri(this.submission.uri)} ${sparqlEscapeUri(PROV('generated').value)} ${sparqlEscapeUri(this.uri)} .
  }
} WHERE {
  GRAPH ?g {
    ${sparqlEscapeUri(this.submission.uri)} ?p ?o .
  }
}`;
        // TODO actually save this in to the triple store :)
        console.log(q);
    }
}