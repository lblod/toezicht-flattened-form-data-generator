import {propertiesFor, step} from "../extractor";
import {Triple} from "../triple";

export default function extract({graph, subject, predicate, replace}) {
    return propertiesFor({
        predicate: replace ? replace : predicate,
        path: [
            (triples) => step({graph, triples, filter: new Triple({ subject, predicate})}),
        ]
    })
}