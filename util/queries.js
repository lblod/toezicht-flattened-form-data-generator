import { sparqlEscapeUri, sparqlEscapeString, sparqlEscapeBoolean } from 'mu';
import { MELDING, PROV } from './namespaces';

const STATUS_SEND_CONCEPT = "http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c";

// TODO can this usage of queries be improved?

export function createSubmissionForQuery(uri) {
  return `
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX pav: <http://purl.org/pav/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

SELECT ?submission ?logicalFile ?physicalFile ?submittedDocument ?organisationId
WHERE {
  BIND (${sparqlEscapeUri(uri)} as ?submission)
  ?submission dct:subject ?submittedDocument ;
    pav:createdBy ?bestuurseenheid .
  ?bestuurseenheid mu:uuid ?organisationId .
  ?submittedDocument dct:source ?physicalFile .
  ?physicalFile nie:dataSource ?logicalFile .
  ?logicalFile dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
} LIMIT 1`;
}

export function createSubmissionFromSubmittedResourceQuery(uuid) {
  return `
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX mu:  <http://mu.semte.ch/vocabularies/core/>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX pav: <http://purl.org/pav/>

SELECT ?submission ?logicalFile ?physicalFile ?submittedDocument ?organisationId
WHERE {
  ?submittedDocument mu:uuid ${sparqlEscapeString(uuid)} .
  ?submission dct:subject ?submittedDocument ;
    pav:createdBy ?bestuurseenheid .
  ?bestuurseenheid mu:uuid ?organisationId .
  ?submittedDocument dct:source ?physicalFile .
  ?physicalFile nie:dataSource ?logicalFile .
  ?logicalFile dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
} LIMIT 1`;
}

// TODO ask about the dct:type of file.
export function createSubmissionFromAutoSubmissionTaskQuery(uri) {
  return `
PREFIX dct:  <http://purl.org/dc/terms/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
PREFIX nie:  <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX pav: <http://purl.org/pav/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

SELECT ?submission ?logicalFile ?physicalFile ?submittedDocument ?organisationId
WHERE {
  ${sparqlEscapeUri(uri)}
    a task:Task ;
    dct:isPartOf ?job .
  ?job prov:generated ?submission .
  ?submission dct:subject ?submittedDocument ;
    pav:createdBy ?bestuurseenheid .
  ?bestuurseenheid mu:uuid ?organisationId .
  ?submittedDocument dct:source ?physicalFile .
  ?physicalFile nie:dataSource ?logicalFile .
  ?logicalFile dct:type <http://data.lblod.gift/concepts/form-data-file-type> .
} LIMIT 1`;
}

export function insertFormDataQuery({uri, uuid, submission, properties}) {
  let statusSendTriple;

  if(submission.isStatusSend) {
    statusSendTriple = `
     ${sparqlEscapeUri(uri)} ext:formSubmissionStatus ${sparqlEscapeUri(STATUS_SEND_CONCEPT)}.
    `;
  }

  return `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX meb: <http://rdf.myexperiment.org/ontologies/base/>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

INSERT {
  GRAPH ${sparqlEscapeUri(submission.graph)} {
    ${sparqlEscapeUri(uri)} a ${sparqlEscapeUri(MELDING('FormData').value)} .
    ${sparqlEscapeUri(uri)} mu:uuid ${sparqlEscapeString(uuid)} .
    ${properties.map((property) => property.toNT(uri)).join('\n    ')}
    ${sparqlEscapeUri(uri)} ${sparqlEscapeUri(PROV('hadPrimarySource').value)} ${sparqlEscapeUri(submission.ttl.uri)} .
    ${sparqlEscapeUri(submission.uri)} ${sparqlEscapeUri(PROV('generated').value)} ${sparqlEscapeUri(uri)} .
    ${statusSendTriple || ""}
  }
} WHERE {
  GRAPH ${sparqlEscapeUri(submission.graph)} {
    ${sparqlEscapeUri(submission.uri)} a meb:Submission .
  }
}`;
}

export function completeFormDataFromSubmissionQuery(submission) {
  return `
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX meb: <http://rdf.myexperiment.org/ontologies/base/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX melding: <http://lblod.data.gift/vocabularies/automatische-melding/>

SELECT DISTINCT ?formDataURI ?formDataUUID
WHERE {
  GRAPH ${sparqlEscapeUri(submission.graph)} {
    ${sparqlEscapeUri(submission.uri)}
      a meb:Submission ;
      prov:generated ?formDataURI .
    ?formDataURI
      a melding:FormData ;
      mu:uuid ?formDataUUID.
  }
} LIMIT 1`;
}

export function deleteFormDataQuery(uri, graph) {
  return `
PREFIX melding: <http://lblod.data.gift/vocabularies/automatische-melding/>

DELETE WHERE {
  GRAPH ${sparqlEscapeUri(graph)} {
    ${sparqlEscapeUri(uri)}
      a melding:FormData ;
      ?predicate ?object .
  }
}`;
}

export function deleteFormDataFromSubmissionQuery(uri, graph) {
  return `
PREFIX meb: <http://rdf.myexperiment.org/ontologies/base/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX melding: <http://lblod.data.gift/vocabularies/automatische-melding/>

DELETE {
  GRAPH ${sparqlEscapeUri(graph)} {
    ${sparqlEscapeUri(uri)} prov:generated ?formData .
    ?formData ?p ?o .
  }
}
WHERE {
  GRAPH ${sparqlEscapeUri(graph)} {
    ${sparqlEscapeUri(uri)}
      a meb:Submission ;
      prov:generated ?formData .
    ?formData ?p ?o .
  }
}`;
}

export function retrieveCodeListQuery(uri) {
  return `
SELECT ?concept
WHERE {
  ?concept <http://www.w3.org/2004/02/skos/core#inScheme> ${sparqlEscapeUri(uri)}
}`;
}
export function askSubmissionSendStatus(submissionUri) {
  return `
    ASK {
      ${sparqlEscapeUri(submissionUri)} <http://www.w3.org/ns/adms#status> ${sparqlEscapeUri(STATUS_SEND_CONCEPT)}
    }
  `;
}
