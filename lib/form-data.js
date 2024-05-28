import { uuid, sparqlEscapeUri } from 'mu';
import { NamedNode, triple } from 'rdflib';
import extractProperties from './extractor';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import {
  completeFormDataFromSubmissionQuery,
  insertFormDataQuery,
  deleteFormDataQuery,
  askSubmissionSendStatus,
} from '../util/queries';

export class FormData {
  constructor({ submission }) {
    this.submission = submission;
    this.properties = [];
  }

  async flatten() {
    const result = await query(completeFormDataFromSubmissionQuery(this.submission));
    const isNew = result.results.bindings.length == 0;
    if (isNew) {
      console.log(`No form data found for submission <${this.submission.uri}>. Going to create a  new flattened form data resource.`);
      this.uuid = uuid();
      this.uri = `http://data.lblod.info/form-data/${this.uuid}`;
    } else {
      const binding = result.results.bindings[0];
      this.uri = binding['formDataURI'].value;
      this.uuid = binding['formDataUUID'].value;
    }

    // we process the form, extracting the properties
    this.properties = await extractProperties({
      graph: this.submission.ttl,
      base: this.submission.resourceURI,
    });

    if (!isNew) {
      const q = deleteFormDataQuery(this.uri, this.submission.graph);
      await update(q);
    }

    const submissionIsStatusSend = await query(askSubmissionSendStatus(this.submission.uri));
    this.submission.isStatusSend = submissionIsStatusSend.boolean;

    // insert flattened resource in triplestore
    const q = insertFormDataQuery({
        uri: this.uri,
        uuid: this.uuid,
        submission: this.submission,
        properties: this.properties,
    });

    await manageArticle({ submission: this.submission });

    await update(q);
  }
}

/*
 * This function keeps the stored besluit:Artikel from the form-data.ttl 
 * in sync with what needs to be availible in the database.
 * Note: It's indeed a bit of a stretch to include the function in this service.
 *   I don't consider this as unlogical place to have it here, and I do think the scope, as decribed in the name of the service
 *   is way too narrow for the purpose of the service itself, i.e. extracting data from the form-data.ttl file and store it in the database
 *  So what is to reconsider here, is rather the name (and thus scope of the service) rather than (the location) of this function.
 */
async function manageArticle({ submission }) {
  //Always flush the previsouly stored besluit:Artikel information.
  const flushArticleQuery = `
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX meb: <http://rdf.myexperiment.org/ontologies/base/>

    DELETE {
      GRAPH ${sparqlEscapeUri(submission.graph)} {
        ?decision <http://data.europa.eu/eli/ontology#has_part> ?article.
        ?article ?articleP ?articleO.
      }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(submission.graph)} {
        ${sparqlEscapeUri(submission.uri)}
          a meb:Submission ;
          dcterms:subject ?decision.

        ?decision <http://data.europa.eu/eli/ontology#has_part> ?article.

        OPTIONAL {
          ?article a <http://data.vlaanderen.be/ns/besluit#Artikel>;
            ?articleP ?articleO.
        }
      }
    }`;

  await update(flushArticleQuery);

  // Extract the actual besluit:Artikel information from the form-data.ttl
  let triples = [];
  const potentialArticleSubjects = submission.ttl.graph
        .match(
          new NamedNode(submission.resourceURI),
          new NamedNode("http://data.europa.eu/eli/ontology#has_part")
        )
        .map(t => t.object);

  for(const subject of potentialArticleSubjects) {
    const isArticle = submission.ttl.graph
          .match(subject,
               new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
               new NamedNode('http://data.vlaanderen.be/ns/besluit#Artikel'));
    if(isArticle.length) {
      triples = [ ...triples, ...submission.ttl.graph.match(subject) ];

      //Note: links the besluit:Artikel to the dcterms:subject
      triples = [ ...triples,
                  ...submission.ttl.graph
                  .match(
                    new NamedNode(submission.resourceURI),
                    new NamedNode("http://data.europa.eu/eli/ontology#has_part"),
                    subject)
                ];
    }
  }

  // Store in database
  const articleTriples = triples.map(t => t.toNT());
  const updateQuery = `
    INSERT DATA {
      GRAPH ${sparqlEscapeUri(submission.graph)} {
         ${articleTriples.join('\n')}
      }
    }
  `;

  if(articleTriples.length) {
    await update(updateQuery);
  }
}
