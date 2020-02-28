import {querySudo as query} from '@lblod/mu-auth-sudo';
import {TurtleFile} from "./turtle-file";
import {createSubmissionForQuery} from "../util/queries";

export const SUBMISSION_SENT_STATUS = 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c';

export class Submission {

    constructor({uri, resourceURI, ttl}) {
        this.uri = uri;
        this.resourceURI = resourceURI;
        this.ttl = ttl;
    }
}

export async function createSubmissionByURI(uri) {

    const result = await query(createSubmissionForQuery(uri));

    if (result.results.bindings.length) {
        const binding = result.results.bindings[0];
        return new Submission({
            uri,
            resourceURI: binding['submittedResourceURI'].value,
            ttl: await new TurtleFile({uri: binding['ttlFileURI'].value}).read()
        });
    } else {
        throw `Nothing found for submission <${uri}>.`
    }
}



