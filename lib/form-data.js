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

    await update(q);

    //Warning: It overrules previously stored information of eli:is_about, if a cross-referended document is found.
    await manageArticle({ formDataUri: this.uri, submission: this.submission });
  }
}

/*
 * Synchronizes the stored `besluit:Artikel` from `form-data.ttl` with the database.
 *
 * Detailed Explanation:
 * 1. This function ensures that the `besluit:Artikel` data in `form-data.ttl` is kept in sync with the database.
 * 2. Note: Including this function in this service might seem a bit of a stretch.
 *    - The current service name suggests a narrow scope focused on extracting data from `form-data.ttl` and storing it in the database.
 *    - However, I believe it's logical to have this function here, considering its purpose.
 *    - The real consideration should be renaming and expanding the scope of the service to reflect its broader functionality.
 * 3. Note 2: When we migrate to `forms-v2`, many of these intermediate steps will likely be significantly simplified.
 * 4. Note 3: It overrules previously stored information of eli:is_about, if a cross-referended document is found.
 */
async function manageArticle({ formDataUri, submission }) {
  //Always flush the previsouly stored besluit:Artikel information.
  const flushArticleQuery = `
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX meb: <http://rdf.myexperiment.org/ontologies/base/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX eli: <http://data.europa.eu/eli/ontology#>
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>

    DELETE {
      GRAPH ${sparqlEscapeUri(submission.graph)} {
        ?decision <http://data.europa.eu/eli/ontology#has_part> ?article.
        ?article ?articleP ?articleO.
      }
    }
    WHERE {
      VALUES ?submission {
        ${sparqlEscapeUri(submission.uri)}
      }

      ?submission
        a meb:Submission ;
        dcterms:subject ?decision.

      ?decision <http://data.europa.eu/eli/ontology#has_part> ?article.

      OPTIONAL {
        ?article a <http://data.vlaanderen.be/ns/besluit#Artikel>;
          ?articleP ?articleO.
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

  let crossReferencedDocuments = []; // We keep track of these, we need them later.
  for(const subject of potentialArticleSubjects) {
    const isArticle = submission.ttl.graph
          .match(subject,
               new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
               new NamedNode('http://data.vlaanderen.be/ns/besluit#Artikel'));
    if(isArticle.length) {
      // We're only using a white-list of information we want to extract:

      // - the rdf:type
      triples = [...triples, ...isArticle];

      // - the cross-reference document
      const crossReferencedTriples = submission.ttl.graph
            .match(subject,
                   new NamedNode("http://data.europa.eu/eli/ontology#refers_to")
                  );
      crossReferencedDocuments = [
        ...crossReferencedDocuments,
        ...crossReferencedTriples.map(t => t.object)
      ];

      triples = [ ...triples,
                  ...crossReferencedTriples
                ];

      // - the besluit:Artikel 'type', i.e. goedering, weigering,...
      triples = [ ...triples,
                  ...submission.ttl.graph
                  .match(
                    subject,
                    new NamedNode("http://data.europa.eu/eli/ontology#type_document")
                  ) ];

      // - links the besluit:Artikel to the dcterms:subject
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
  let updateQuery = `
    INSERT DATA {
      GRAPH ${sparqlEscapeUri(submission.graph)} {
         ${articleTriples.join('\n')}
      }
    }`;

  /*
   * This code handles the query logic for updating the `eli:is_about` predicate
   * when cross-referenced documents are found in the form data.
   *
   * Detailed Explanation:
   * 1. If cross-referenced documents are present in the form data,
   *    the `eli:is_about` predicate is updated to refer to the
   *    `bestuurseenheid` that initially created the cross-referenced document.
   * 2. WARNING: This logic flushes `eli:is_about` previously stored.
   *   In the (unlikely) case `eli:is_about` is managed by another form field AND the cross-referenced doc, we will re-think the process.
   */
  if(crossReferencedDocuments.length) {
    updateQuery += `
      ;

      DELETE {
        GRAPH ${sparqlEscapeUri(submission.graph)} {
          ?formData <http://data.europa.eu/eli/ontology#is_about> ?eenheid.
        }
      }
      INSERT {
        GRAPH ${sparqlEscapeUri(submission.graph)} {
          ?formData <http://data.europa.eu/eli/ontology#is_about> ?crossRefEenheid.
        }
      }
      WHERE {
        VALUES ?formData {
          ${sparqlEscapeUri(formDataUri)}
        }
        VALUES ?crossDocument {
          ${
             crossReferencedDocuments
               .map(to => to.toNT())
               .join('\n')
           }
        }
        ?submission <http://purl.org/dc/terms/subject> ?crossDocument;
          a <http://rdf.myexperiment.org/ontologies/base/Submission>;
          <http://purl.org/pav/createdBy> ?crossRefEenheid.

        OPTIONAL {
          ?formData <http://data.europa.eu/eli/ontology#is_about> ?eenheid.
        }
      }`;
  }

  if(articleTriples.length) {
    await update(updateQuery);
  }
}
