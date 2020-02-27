import {EXT, LBLOD_BESLUIT, SCHEMA} from "../../util/namespaces";
import {Property} from "../property";

export default function propertiesFor({graph, filters: {subject}}) {
    let triples = graph.match(subject, LBLOD_BESLUIT('taxRate'), undefined);
    triples = triples.flatMap(triple => graph.match(triple.object, SCHEMA('price'), undefined));
    return triples.map(triple => new Property({
        predicate: EXT('taxRateAmount'),
        object: triple.object
    }) )
}