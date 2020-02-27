import {DCT, EXT, PROV, BESLUIT} from "../../util/namespaces";
import {Property} from "../property";

export default function propertiesFor({graph, filter}) {
    let triples;
    if (filter.predicate) {
        triples = graph.match(undefined, filter.predicate, filter.object);
    } else {
        triples = graph.match(undefined, PROV('generated'),filter.object);
        triples = triples.flatMap(triple => graph.match(triple.subject, DCT('subject'), undefined));
        triples = triples.flatMap(triple => graph.match(undefined, BESLUIT('behandelt'), triple.object));
    }
    triples = triples.flatMap(triple => graph.match(triple.subject, PROV('startedAtTime'), undefined));
    return triples.map(triple => new Property({
        predicate: EXT('sessionStartedAtTime'),
        object: triple.object
    }))
}