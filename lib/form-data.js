import {uuid} from 'mu';
import extractProperties from "./extractor";
import {querySudo as query, updateSudo as update} from '@lblod/mu-auth-sudo';
import {completeFormDataFromSubmissionQuery, insertFormDataQuery} from "../util/queries";

export class FormData {

    set uri(val) {
        this.internalUri = val;
    }

    get uri() {
        if(this.internalUri) {
            return this.internalUri;
        }
        return `http://data.lblod.info/form-data/${this.uuid}`;
    }

    constructor({uri, uuid, submission}) {
        this.uri = uri;
        this.uuid = uuid;
        this.submission = submission;
        this.properties = [];
    }

    async init() {
        console.log('-- INITIALIZING FORM-DATA --');
        const result = await query(completeFormDataFromSubmissionQuery(this.submission.uri));
        if (result.results.bindings.length) {
            console.log('-- FORM-DATA FOUND --');
            const binding = result.results.bindings[0];
            return new FormData({
                uri: binding['formDataURI'].value,
                uuid: binding['formDataUUID'].value,
                submission: this.submission
            });
        } else {
            console.log('-- NO FORM-DATA FOUND, CREATING NEW --');
            return new FormData({
                uuid: uuid(),
                submission: this.submission
            });
        }
    }

    process() {
        this.properties = extractProperties({
            graph: this.submission.ttl,
            base: this.submission.resourceURI
        });
    }

    /**
     * will insert this "FormData" object into the triple store
     */
    async insert() {
        console.log('-- INSERTING NEW FORM-DATA --');
        const q = insertFormDataQuery({
            uri: this.uri,
            uuid: this.uuid,
            submission: this.submission,
            properties: this.properties
        });
        await update(q);
    }
}
