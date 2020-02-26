import {DCT, ELI, ELOD, LBLOD_BESLUIT, RDF, RDFS} from "../util/namespaces";
import {Property} from "./property";
import taxRateAmount from "./extractors/tax-rate-amount";

const EXTRACTORS = [
    (graph) => propertiesFor({graph, target: RDF('type'), replacement: DCT('type')}),
    (graph) => propertiesFor({graph, target: ELI('date_publication')}),
    (graph) => propertiesFor({graph, target: ELI('passed_by')}),
    (graph) => propertiesFor({graph, target: ELI('is_about')}),
    (graph) => propertiesFor({graph, target: ELOD('financialYear')}),
    (graph) => propertiesFor({graph, target: ELI('first_date_entry_in_force')}),
    (graph) => propertiesFor({graph, target: ELI('date_no_longer_in_force')}),
    (graph) => propertiesFor({graph, target: LBLOD_BESLUIT('authenticityType')}),
    (graph) => propertiesFor({graph, target: LBLOD_BESLUIT('chartOfAccount')}),
    (graph) => propertiesFor({graph, target: LBLOD_BESLUIT('taxType')}),
    (graph) => propertiesFor({graph, target: LBLOD_BESLUIT('taxRate')}),
    (graph) => propertiesFor({graph, target: LBLOD_BESLUIT('hasAdditionalTaxRate')}),
    (graph) => propertiesFor({graph, target: DCT('description')}),
    (graph) => propertiesFor({graph, target: RDFS('comment')}),
    (graph) => propertiesFor({graph, target: DCT('hasPart')}),
    (graph) => taxRateAmount({graph})
    // TODO ext:sessionStartedAtTime   -->    ^prov:generated/dct:subject/^besluit:behandelt/prov:startedAtTime
];

export default function extractProperties(graph) {
    return EXTRACTORS.flatMap(extractor => {
        return extractor(graph);
    })
}

/**
 *  Function will create an {@class Property} for each triple with the target predicate.
 *  If an replacement predicate was given, the {@class Property} will receive this as its predicate.
 *
 * @param graph - the graph to query for triples
 * @param target - the predicate to search for
 * @param replacement - the predicate to replace with
 *
 * @returns {Property[]} list of al the extracted properties for the given graph and target.
 */
function propertiesFor({graph, target, replacement}) {
    const triples = graph.match(undefined, target, undefined);
    return triples.flatMap(triple =>
        new Property({
            predicate: replacement ? replacement : target,
            object: triple.object
        }))
}

/**
 * Similar to {@function propertiesFor} but will keep going until an LITERAL object was found.
 */
function propertyForLiteral({graph, target, replacement}) {
    const triples = graph.match(undefined, target, undefined);
    return triples.flatMap(triple => {
        let triples = getLiterals({graph, triples: [triple]});
        return triples.map(value =>
            new Property({
                predicate: replacement ? replacement : target,
                object: value.object
            })
        )
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