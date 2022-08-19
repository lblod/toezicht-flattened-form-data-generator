import { querySudo as query } from '@lblod/mu-auth-sudo';
import { TurtleFile } from './turtle-file';
import {
  createSubmissionForQuery,
  createSubmissionFromAutoSubmissionTaskQuery,
  createSubmissionFromSubmittedResourceQuery,
  deleteFormDataFromSubmissionQuery,
} from '../util/queries';

export const SUBMISSION_SENT_STATUS = 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c';
export const SUBMISSION_DELETED_STATUS = 'http://lblod.data.gift/concepts/faa5110a-fdb2-47fa-a0d2-118e5542ef05';

export class Submission {
  constructor({ uri, resourceURI, ttl }) {
    this.uri = uri;
    this.resourceURI = resourceURI;
    this.ttl = ttl;
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

export async function deleteFormDataFromSubmission(uri) {
  await query(deleteFormDataFromSubmissionQuery(uri));
}

async function createSubmission(q) {
  console.log('-- RETRIEVING SUBMISSION --');
  try {
    const result = await query(q);
    if (result.results.bindings.length) {
      const binding = result.results.bindings[0];
      return new Submission({
        uri: binding['submission'].value,
        resourceURI: binding['submittedResourceURI'].value,
        ttl: await new TurtleFile({ uri: binding['ttlFileURI'].value }).read(),
      });
    } else {
      console.log('No submission found.');
      return null;
    }
  } catch (e) {
    console.log('Something went wrong while trying to retrieve/create the submissions.');
    console.log(`Exception: ${e.stack}`);
    return null;
  }
}
