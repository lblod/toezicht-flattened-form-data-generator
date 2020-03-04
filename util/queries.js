import {sparqlEscapeUri, sparqlEscapeString} from 'mu';
import {MELDING, PROV} from "./namespaces";

// TODO can this usage of queries be improved?

export function createSubmissionForQuery(uri) {
    return `
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?submission ?ttlFileURI ?submittedResourceURI
WHERE {
    ${sparqlEscapeUri(uri)} dct:subject ?submittedResourceURI .
    ?submission dct:subject ?submittedResourceURI .
    ?submittedResourceURI dct:source ?ttlFileURI .
    ?ttlFileURI dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
} LIMIT 1
`
}

export function createSubmissionFromSubmittedResourceQuery(uuid) {
    return `
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

SELECT ?submission ?ttlFileURI ?submittedResourceURI
WHERE {
    ?submittedResource mu:uuid ${sparqlEscapeString(uuid)} .
    ?submission dct:subject ?submittedResourceURI .
    ?submittedResourceURI dct:source ?ttlFileURI .
    ?ttlFileURI dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
} LIMIT 1`
}

export function createSubmissionFromAutoSubmissionTaskQuery(uri) {
    return `
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX melding: <http://lblod.data.gift/vocabularies/automatische-melding/>

SELECT ?submission ?ttlFileURI ?submittedResourceURI
WHERE {
    ${sparqlEscapeUri(uri)} a melding:AutomaticSubmissionTask ;
                            prov:generated ?submission ;
                            adms:status <http://lblod.data.gift/automatische-melding-statuses/successful-concept> .
    ?submission dct:subject ?submittedResourceURI .
    ?submittedResourceURI dct:source ?ttlFileURI .
    ?ttlFileURI dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
} LIMIT 1`
}

export function insertFormDataQuery({uri, uuid, submission, properties}) {
   return `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

INSERT {
  GRAPH ?g {
    ${sparqlEscapeUri(uri)} a ${sparqlEscapeUri(MELDING('FormData').value)} .
    ${sparqlEscapeUri(uri)} mu:uuid ${sparqlEscapeString(uuid)} .
    ${(properties.map(property => property.toNT(uri)).join('\n\t'))}
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