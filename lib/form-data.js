import {uuid, sparqlEscapeUri} from 'mu';
import extractProperties from "./extractor";


export class FormData {

    get uri() {
        // TODO is this oke?
        return `http://data.lblod.gift/forms/0711f911-4c75-4097-8cad-616fef08ffcd${this.uuid}`
    }

    constructor(submission) {
        this.submission = submission;
        this.uuid = uuid();
        this.properties = [];
    }

    process() {
        this.properties = extractProperties(this.submission.graph);
    }

    /**
     * will insert this "FormData" object into the triple store
     */
    insert() {
        console.log(this.properties);
        console.log("-- INSERTING FORM --");

        const q = `
INSERT {
  GRAPH ?g {
    ${(this.properties.map(property =>  property.toNT(this.uri)).join('\n \t'))}
    // TODO add other requirements/links
  }
} WHERE {
  GRAPH ?g {
    // TODO
  }
}`;

        console.log(q);
    }
}