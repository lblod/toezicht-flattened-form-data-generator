import {uuid, sparqlEscapeUri, sparqlEscapeString} from 'mu';
import extractProperties from "./extractor";
import {MELDING, PROV} from "../util/namespaces";


export class Form {

    get uri() {
        // TODO is this oke?
        return `http://data.lblod.gift/forms/0711f911-4c75-4097-8cad-616fef08ffcd${this.uuid}`
    }

    constructor(submissionUri, ttl) {
        this.submissionUri = submissionUri;
        this.ttl = ttl;

        this.uuid = uuid();
        this.properties = [];
    }

    process() {
        this.properties = extractProperties(this.ttl.graph);
    }

    /**
     * will insert this "FormData" object into the triple store
     */
    insert() {
        console.log(this.properties);
        console.log("-- INSERTING FORM --");

        const q = `
INSERT {
  GRAPH ?g {
    ${sparqlEscapeUri(this.uri)} a:type ${sparqlEscapeUri(MELDING('FormData').value)}
    ${(this.properties.map(property => property.toNT(this.uri)).join('\n \t'))}
    ${sparqlEscapeUri(this.uri)} ${sparqlEscapeUri(PROV('hadPrimarySource').value)} ${sparqlEscapeString(this.ttl.location)} .
    ${sparqlEscapeUri(this.submissionUri)} ${sparqlEscapeUri(PROV('generated').value)} ${sparqlEscapeUri(this.uri)} .
  }
} WHERE {
  GRAPH ?g {
    ${sparqlEscapeUri(this.submissionUri)} ?p ?o
  }
}`;
        // TODO actually save this in to the triple store :)
        console.log(q);
    }
}