import {sparqlEscapeUri, sparqlEscapeString} from 'mu';
import {MELDING, PROV} from './namespaces';

// TODO can this usage of queries be improved?

export function createSubmissionForQuery(uri) {
    return `
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?submission ?ttlFileURI ?submittedResourceURI
WHERE {
    BIND (${sparqlEscapeUri(uri)} as ?submission)
    ?submission dct:subject ?submittedResourceURI .
    ?submittedResourceURI dct:source ?ttlFileURI .
    ?ttlFileURI dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
} LIMIT 1`;
}

export function createSubmissionFromSubmittedResourceQuery(uuid) {
    return `
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

SELECT ?submission ?ttlFileURI ?submittedResourceURI
WHERE {
    ?submittedResourceURI mu:uuid ${sparqlEscapeString(uuid)} .
    ?submission dct:subject ?submittedResourceURI .
    ?submittedResourceURI dct:source ?ttlFileURI .
    ?ttlFileURI dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
} LIMIT 1`;
}

// TODO ask about the dct:type of file.
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
} LIMIT 1`;
}

export function insertFormDataQuery({uri, uuid, submission, properties}) {
    return `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX meb: <http://rdf.myexperiment.org/ontologies/base/>

INSERT {
  GRAPH ?g {
    ${sparqlEscapeUri(uri)} a ${sparqlEscapeUri(MELDING('FormData').value)} .
    ${sparqlEscapeUri(uri)} mu:uuid ${sparqlEscapeString(uuid)} .
    ${(properties.map(property => property.toNT(uri)).join('\n    '))}
    ${sparqlEscapeUri(uri)} ${sparqlEscapeUri(PROV('hadPrimarySource').value)} ${sparqlEscapeUri(submission.ttl.uri)} .
    ${sparqlEscapeUri(submission.uri)} ${sparqlEscapeUri(PROV('generated').value)} ${sparqlEscapeUri(uri)} .
  }
} WHERE {
  GRAPH ?g {
    ${sparqlEscapeUri(submission.uri)} a meb:Submission .
  }
}`;
}

export function completeFormDataFromSubmissionQuery(uri) {
    return `
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX meb: <http://rdf.myexperiment.org/ontologies/base/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX melding: <http://lblod.data.gift/vocabularies/automatische-melding/>

SELECT DISTINCT ?formDataURI ?formDataUUID

WHERE {
    ${sparqlEscapeUri(uri)} a meb:Submission ;
                            prov:generated ?formDataURI .
    ?formDataURI a melding:FormData ;
                 mu:uuid ?formDataUUID.
} LIMIT 1`;
}

export function deleteFormDataQuery(uri) {
    return `
PREFIX melding: <http://lblod.data.gift/vocabularies/automatische-melding/>

DELETE WHERE {
    GRAPH ?g {
    ${sparqlEscapeUri(uri)} a melding:FormData ;
                            ?predicate ?object .
    }
}`;
}

export function retrieveCodeListQuery(uri) {
    return `
SELECT ?concept
WHERE {
  ?concept <http://www.w3.org/2004/02/skos/core#inScheme> ${sparqlEscapeUri(uri)}
}
`
}