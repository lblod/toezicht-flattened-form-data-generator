import {DCT, EXT, PROV, BESLUIT, LBLOD_BESLUIT} from "../../util/namespaces";
import {Property} from "../property";
import {inverseStep, propFor, step} from "../extractor";
import {Triple} from "../triple";

export default function propertiesFor({graph, subject}) {
    let properties = [];

    properties = properties.concat(
        propFor({
            predicate: EXT('sessionStartedAtTime'),
            path: [
                (triples) => inverseStep({graph, triples, filter: new Triple({predicate: PROV('generated')})}), // TODO temp undefined subject
                (triples) => step({graph, triples, filter: new Triple({predicate: DCT('subject')})}),
                (triples) => inverseStep({graph, triples, filter: new Triple({predicate: BESLUIT('behandelt')})}),
                (triples) => step({graph, triples, filter: new Triple({predicate: PROV('startedAtTime')})}),
            ]
        })
    );

    let besluitenPredicates = ['heeftBesluitenlijst', 'heeftNotulen', 'heeftAgenda', 'heeftUittreksel'];

    properties = properties.concat(besluitenPredicates.flatMap(predicate =>
        propFor({
            predicate: EXT('sessionStartedAtTime'),
            path: [
                (triples) => inverseStep({graph, triples, filter: new Triple({subject, predicate: BESLUIT(predicate)})}),
                (triples) => step({graph, triples, filter: new Triple({predicate: PROV('startedAtTime')})}),
            ]
        })
    ));

    return properties;
}