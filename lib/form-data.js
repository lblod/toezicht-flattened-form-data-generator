import { uuid } from 'mu';
import {NamedNode} from 'rdflib';
import {TurtleFile} from "./turtle-file";

export class FormData {

    get uri() {
        // TODO is this oke?
        return `http://data.lblod.gift/forms/0711f911-4c75-4097-8cad-616fef08ffcd${uuid}`
    }

    constructor(submissionUri, submission) {
        this.submissionUri = submissionUri;
        this.submission =  submission;
        this.uuid = uuid();
        this.triples = [];
        // this.generateTriples();
    }

    process() {
        this.processDefaults();
        // this.processInverse();
        // this.processChildren();
    }

    processDefaults() {
        const triples = this.submission.graph.match(new NamedNode(this.submissionUri), undefined, undefined);
        debugger;
    }

    // generateTriples() {
    //     for(let i = 0; i < this.submission.triples.length; i++){
    //         this.addTriple(this.submission.triples[i]);
    //     }
    // }

    // addTriple(triple) {
    //     if(this.isInverseTriple(triple)) {
    //         this.addInverseTriple(triple);
    //     } else if (this.isChildTriple(triple)) {
    //         this.addChildTriple(triple);
    //     } else {
    //         // TODO map predicate to something we want
    //         this.triples.push({
    //             subject : this.uri,
    //             predicate: "TO MAP",
    //             object: triple.object.value
    //         });
    //     }
    // }

    isInverseTriple(triple) {
        return (triple.object.value === this.submission.uri);
    }

    addInverseTriple(triple) {
        // TODO predicate could also change
        this.triples.push({
            subject : triple.subject.value,
            predicate: triple.predicate.value,
            object: this.uri
        });
    }

    isChildTriple(triple) {
        return (triple.subject.value !== this.submission.uri) && (triple.subject.value !== this.submission.uri);
    }

    addChildTriple(triple) {
        this.triples.push({
            subject : triple.subject.value,
            predicate: triple.predicate.value,
            object: triple.object.value,
        })
    }

    /**
     * will insert this "FormData" object into the triple store
     */
    insert() {
        console.log(this.triples);
        console.log("-- INSERTING FORM --")
    }
}