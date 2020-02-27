import {EXT, LBLOD_BESLUIT, SCHEMA} from "../../util/namespaces";
import {propertiesFor, step} from "../extractor";
import {Triple} from "../triple";

export default function extract({graph, subject}) {
    return propertiesFor({
        predicate: EXT('taxRateAmount'),
        path: [
            (triples) => step({graph, triples, filter: new Triple({subject, predicate: LBLOD_BESLUIT('taxRate')})}),
            (triples) => step({graph, triples, filter: new Triple({predicate: SCHEMA('price')})})
        ]
    })
}