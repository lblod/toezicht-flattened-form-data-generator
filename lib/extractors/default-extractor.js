import {propertiesFor, step} from "../extractor";

export default function extract({graph, base, find, replaceWith}) {
    return propertiesFor({
        predicate: replaceWith ? replaceWith : find,
        path: [
            (triples) => step({graph, base, find, triples}),
        ]
    })
}