import { uuid } from 'mu';
import extract from "./predicates";


export class FormData {

    get uri() {
        // TODO is this oke?
        return `http://data.lblod.gift/forms/0711f911-4c75-4097-8cad-616fef08ffcd${uuid}`
    }

    constructor(submission) {
        this.submission =  submission;
        this.uuid = uuid();
        this.properties = [];
    }

    process() {
        this.properties = extract(this.submission.graph);
    }

    /**
     * will insert this "FormData" object into the triple store
     */
    insert() {
        console.log(this.properties);
        console.log("-- INSERTING FORM --")
    }
}