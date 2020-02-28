import {DCT, EXT, PROV, BESLUIT} from "../../util/namespaces";
import {inverseStep, propertiesFor, step} from "../extractor";
import {Triple} from "../triple";

export default function extract({graph, base}) {

    let properties = propertiesFor({
            predicate: EXT('sessionStartedAtTime'),
            path: [
                (triples) => inverseStep({graph, triples, filter: new Triple({base, predicate: PROV('generated')})}), // TODO temp undefined subject
                (triples) => step({graph, triples, filter: new Triple({predicate: DCT('subject')})}),
                (triples) => inverseStep({graph, triples, filter: new Triple({predicate: BESLUIT('behandelt')})}),
                (triples) => step({graph, triples, filter: new Triple({predicate: PROV('startedAtTime')})}),
            ]
        });

    let besluitenPredicates = ['heeftBesluitenlijst', 'heeftNotulen', 'heeftAgenda', 'heeftUittreksel'];

    properties = properties.concat(besluitenPredicates.flatMap(predicate =>
        propertiesFor({
            predicate: EXT('sessionStartedAtTime'),
            path: [
                (triples) => inverseStep({graph, triples, filter: new Triple({base, predicate: BESLUIT(predicate)})}),
                (triples) => step({graph, triples, filter: new Triple({predicate: PROV('startedAtTime')})}),
            ]
        })
    ));

    return properties;
}