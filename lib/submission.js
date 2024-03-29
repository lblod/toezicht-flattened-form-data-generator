import { querySudo as query } from '@lblod/mu-auth-sudo';
import { TurtleFile } from './turtle-file';
import {
  createSubmissionForQuery,
  createSubmissionFromAutoSubmissionTaskQuery,
  createSubmissionFromSubmittedResourceQuery,
  deleteFormDataFromSubmissionQuery,
} from '../util/queries';
import * as config from '../config';

export const SUBMISSION_SENT_STATUS = 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c';
export const SUBMISSION_DELETED_STATUS = 'http://lblod.data.gift/concepts/faa5110a-fdb2-47fa-a0d2-118e5542ef05';

export class Submission {
  constructor({ uri, resourceURI, ttl, graph }) {
    this.uri = uri;
    this.resourceURI = resourceURI;
    this.ttl = ttl;
    this.graph = graph;
  }
}

export async function createSubmissionFromSubmission(uri) {
  return await createSubmission(createSubmissionForQuery(uri));
}

export async function createSubmissionFromSubmissionResource(uuid) {
  return await createSubmission(createSubmissionFromSubmittedResourceQuery(uuid));
}

export async function createSubmissionFromSubmissionTask(uri) {
  return await createSubmission(createSubmissionFromAutoSubmissionTaskQuery(uri));
}

export async function deleteFormDataFromSubmission(uri, graph) {
  await query(deleteFormDataFromSubmissionQuery(uri, graph));
}

async function createSubmission(q) {
  console.log('-- RETRIEVING SUBMISSION --');
  try {
    const result = await query(q);
    if (result.results.bindings.length) {
      const binding = result.results.bindings[0];
      return new Submission({
        uri: binding['submission'].value,
        resourceURI: binding['submittedDocument'].value,
        ttl: await new TurtleFile({ uri: binding['physicalFile'].value }).read(),
        graph: config.GRAPH_TEMPLATE.replace('~ORGANIZATION_ID~', binding.organisationId.value),
      });
    } else {
      console.log('No submission found.');
    }
  } catch (e) {
    console.log('Something went wrong while trying to retrieve/create the submissions.');
    console.log(`Exception: ${e.stack}`);
    throw e;
  }
}
