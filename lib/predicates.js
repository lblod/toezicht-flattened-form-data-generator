import {DCT, ELI, ELOD, LBLOD_BESLUIT, RDF, RDFS} from "../util/namespaces";
import {Property} from "./property";

const EXTRACTORS = [
    (graph) => simpleExtractor({graph, target: RDF('type'), replacement: DCT('type')}),
    (graph) => simpleExtractor({graph, target: ELI('date_publication')}),
    (graph) => simpleExtractor({graph, target: ELI('passed_by')}),
    (graph) => simpleExtractor({graph, target: ELI('is_about')}),
    (graph) => simpleExtractor({graph, target: ELOD('financialYear')}),
    (graph) => simpleExtractor({graph, target: ELI('first_date_entry_in_force')}),
    (graph) => simpleExtractor({graph, target: ELI('date_no_longer_in_force')}),
    (graph) => simpleExtractor({graph, target: LBLOD_BESLUIT('authenticityType')}),
    (graph) => simpleExtractor({graph, target: LBLOD_BESLUIT('chartOfAccount')}),
    (graph) => simpleExtractor({graph, target: LBLOD_BESLUIT('taxRate'), flatten: true}),
    (graph) => simpleExtractor({graph, target: LBLOD_BESLUIT('taxType')}),
    (graph) => simpleExtractor({graph, target: LBLOD_BESLUIT('hasAdditionalTaxRate')}),
    (graph) => simpleExtractor({graph, target: DCT('description')}),
    (graph) => simpleExtractor({graph, target: RDFS('comment')}),
    // TODO what about the linked part???
    (graph) => simpleExtractor({graph, target: DCT('hasPart')}),
    // TODO ext:sessionStartedAtTime   -->    ^prov:generated/dct:subject/^besluit:behandelt/prov:startedAtTime
];

export default function extract(graph) {
    return EXTRACTORS.flatMap(extractor => {
        return extractor(graph);
    })
}

// TODO we are going to simplify all of this, this is cool but very (overly) complex.
function simpleExtractor({graph, target, replacement, flatten}) {
    const triples = graph.match(undefined, target, undefined);
    return triples.flatMap(triple => {
        if (flatten) {
            let values = getLiterals({graph, triples: [triple]});
            return values.map(value =>
                new Property({
                    predicate: replacement ? replacement : target,
                    object: value.object
                })
            );
        } else {
            return new Property({
                    predicate: replacement ? replacement : target,
                    object: triple.object
                }
            );
        }
    });
}

function getLiterals({graph, triples}) {
    return triples.flatMap(triple => {
        if (triple.object.termType === "Literal") {
            return triple;
        } else {
            return getLiterals({
                triples: graph.match(triple.object, undefined, undefined),
                graph
            });
        }
    })
}