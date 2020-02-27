import {EXT, LBLOD_BESLUIT, SCHEMA} from "../../util/namespaces";
// import {Property} from "../property";
import {propFor, step} from "../extractor";
import {Triple} from "../triple";

export default function propertiesFor({graph, subject}) {
    return propFor({
        predicate: EXT('taxRateAmount'),
        path: [
            (triples) => step({graph, triples, filter: new Triple({subject, predicate: LBLOD_BESLUIT('taxRate')})}),
            (triples) => step({graph, triples, filter: new Triple({predicate: SCHEMA('price')})})
        ]
    })
}