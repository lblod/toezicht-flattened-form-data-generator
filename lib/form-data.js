import {uuid} from 'mu';
import extractProperties from "./extractor";
import {updateSudo as update} from '@lblod/mu-auth-sudo';
import {insertFormDataQuery} from "../util/queries";

export class FormData {

    get uri() {
        return `http://data.lblod.info/form-data/${this.uuid}`
    }

    constructor({submission}) {
        this.uuid = uuid();
        this.submission = submission;
        this.properties = [];
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
        console.log("-- INSERTING FORM-DATA --");
        const q = insertFormDataQuery({
            uri: this.uri,
            uuid: this.uuid,
            submission: this.submission,
            properties: this.properties
        });
        await update(q);
    }
}