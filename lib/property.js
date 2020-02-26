import {sparqlEscapeUri, sparqlEscape} from 'mu';
import {sparqlEscapeRDFLibObject} from "../util/rdflib-to-sparql";
export class Property {
    constructor({predicate, object}) {
        this.predicate = predicate;
        this.object = object;
    }

    // TODO make work with more complex predicate and object
    toNT(subject) {
        return `${sparqlEscapeUri(subject)} ${sparqlEscapeUri(this.predicate.value)} ${sparqlEscapeRDFLibObject(this.object)} .`;
    }
}

function escapeDataType(object, datatype) {

}