import flatten from "lodash.flatten";

export class Delta {

    constructor(delta) {
        this.delta = delta;
    }

    get inserts(){
        return flatten(this.delta.map(changeSet => changeSet.inserts));
    }

    getInsertsFor(trigger) {
        return this.inserts.filter(triple => this.isTriggerTriple(triple, trigger));
    }

    isTriggerTriple(triple, trigger) {
        return triple.predicate.value === trigger.predicate.value
            && triple.object.value === trigger.object.value;
    }

}