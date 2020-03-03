import {querySudo as query} from '@lblod/mu-auth-sudo';
import {TurtleFile} from "./turtle-file";
import {
    createSubmissionForQuery,
    createSubmissionFromAutoSubmissionTaskQuery,
    createSubmissionFromSubmittedResourceQuery
} from "../util/queries";

export const SUBMISSION_SENT_STATUS = 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c';
export const SUBMISSION_TASK_SUCCESSFUL = 'http://lblod.data.gift/automatische-melding-statuses/successful-concept';

export class Submission {

    constructor({uri, resourceURI, ttl}) {
        this.uri = uri;
        this.resourceURI = resourceURI;
        this.ttl = ttl;
    }
}

export async function createSubmissionFromSubmission(uri) {
    return await createSubmission(createSubmissionForQuery(uri))
}

export async function createSubmissionFromSubmissionResource(uri) {
   return await createSubmission(createSubmissionFromSubmittedResourceQuery(uri))
}

export async function createSubmissionFromSubmissionTask(uri) {
    return await createSubmission(createSubmissionFromAutoSubmissionTaskQuery(uri))
}

async function createSubmission(q) {
    console.log("-- RETRIEVING SUBMISSION --");
    const result = await query(q);
    if (result.results.bindings.length) {
        const binding = result.results.bindings[0];
        return new Submission({
            uri: binding['submission'].value,
            resourceURI: binding['submittedResourceURI'].value,
            ttl: await new TurtleFile({uri: binding['ttlFileURI'].value}).read()
        });
    } else {
        throw `Nothing found for <${uri}>.`
    }
}



