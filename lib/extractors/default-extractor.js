import {propertiesFor, step} from "../extractor";
import {Triple} from "../triple";

export default function extract({graph, base, find, replaceWith}) {
    return propertiesFor({
        predicate: replaceWith ? replaceWith : find,
        path: [
            (triples) => step({graph, triples, filter: new Triple({ base, find})}),
        ]
    })
}