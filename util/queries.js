import {sparqlEscapeUri, sparqlEscapeString} from 'mu';
import {MELDING, PROV} from "./namespaces";

// TODO add following check to the query  --> ?ttlFileURI dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
// TODO move queries to separate file.
export function createSubmissionForQuery(uri) {
    return `
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?ttlFileURI ?submittedResourceURI
WHERE {
  GRAPH ?g {
    ${sparqlEscapeUri(uri)} dct:subject ?submittedResourceURI .
    ?submittedResourceURI dct:source ?ttlFileURI .
  }
} LIMIT 1
`
}

export function insertFormData({uri, uuid, submission, properties}) {
   return `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

INSERT {
  GRAPH ?g {
    ${sparqlEscapeUri(uri)} a ${sparqlEscapeUri(MELDING('FormData').value)} .
    ${sparqlEscapeUri(uri)} mu:uuid ${sparqlEscapeString(uuid)} .
    ${(properties.map(property => property.toNT(uri)).join('\n \t'))}
    ${sparqlEscapeUri(uri)} ${sparqlEscapeUri(PROV('hadPrimarySource').value)} ${sparqlEscapeUri(submission.ttl.uri)} .
    ${sparqlEscapeUri(submission.uri)} ${sparqlEscapeUri(PROV('generated').value)} ${sparqlEscapeUri(uri)} .
  }
} WHERE {
  GRAPH ?g {
    ${sparqlEscapeUri(submission.uri)} ?p ?o .
  }
}
`
}