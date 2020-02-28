import {EXT, LBLOD_BESLUIT, SCHEMA} from "../../util/namespaces";
import {propertiesFor, step} from "../extractor";

export default function extract({graph, base}) {
    return propertiesFor({
        predicate: EXT('taxRateAmount'),
        path: [
            (triples) => step({graph, base, find: LBLOD_BESLUIT('taxRate'), triples}),
            (triples) => step({graph, triples, find: SCHEMA('price')})
        ]
    })
}