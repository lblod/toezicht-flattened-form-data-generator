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
        this.properties = extractProperties({
            graph: this.submission.ttl.graph,
            filters: {
                subject: this.submission.subject
            }
        });
        this.insert();
    }

    /**
     * will insert this "FormData" object into the triple store
     */
    insert() {
        console.log(this.properties);
        console.log("-- INSERTING FORM --");

        // TODO add mu:uuid to the form data
        const q = `
INSERT {
  GRAPH ?g {
    ${sparqlEscapeUri(this.uri)} a:type ${sparqlEscapeUri(MELDING('FormData').value)}
    ${(this.properties.map(property => property.toNT(this.uri)).join('\n \t'))}
    ${sparqlEscapeUri(this.uri)} ${sparqlEscapeUri(PROV('hadPrimarySource').value)} ${sparqlEscapeString(this.submission.ttl.location)} .
    ${sparqlEscapeUri(this.submission.uri)} ${sparqlEscapeUri(PROV('generated').value)} ${sparqlEscapeUri(this.uri)} .
  }
} WHERE {
  GRAPH ?g {
    ${sparqlEscapeUri(this.submission.uri)} ?p ?o
  }
}`;
        // TODO actually save this in to the triple store :)
        console.log(q);
    }
}