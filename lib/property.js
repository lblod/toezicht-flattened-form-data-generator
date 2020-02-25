export class Property {
    constructor(predicate, object) {
        this.predicate = predicate;
        this.object = object;
    }

    toNT(subject) {
        return subject + this.predicate + this.object;
    }
}