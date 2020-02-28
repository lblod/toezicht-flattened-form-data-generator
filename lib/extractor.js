import {NamedNode, triple} from 'rdflib';
import {DCT, ELI, ELOD, LBLOD_BESLUIT, RDF, RDFS} from "../util/namespaces";
import {Property} from "./property";
import extract from "./extractors/default-extractor"
import taxRateAmount from "./extractors/tax-rate-amount";
import sessionStartedAtTime from "./extractors/session-started-at-time";

const EXTRACTORS = [
    ({graph, base}) => extract({graph, base, find: RDF('type'), replaceWith: DCT('type')}),
    ({graph, base}) => extract({graph, base, find: ELI('date_publication')}),
    ({graph, base}) => extract({graph, base, find: ELI('passed_by')}),
    ({graph, base}) => extract({graph, base, find: ELI('is_about')}),
    ({graph, base}) => extract({graph, base, find: ELI('first_date_entry_in_force')}),
    ({graph, base}) => extract({graph, base, find: ELI('date_no_longer_in_force')}),
    ({graph, base}) => extract({graph, base, find: ELOD('financialYear')}),
    ({graph, base}) => extract({graph, base, find: LBLOD_BESLUIT('authenticityType')}),
    ({graph, base}) => extract({graph, base, find: LBLOD_BESLUIT('chartOfAccount')}),
    ({graph, base}) => extract({graph, base, find: LBLOD_BESLUIT('taxType')}),
    ({graph, base}) => extract({graph, base, find: LBLOD_BESLUIT('taxRate')}),
    ({graph, base}) => extract({graph, base, find: LBLOD_BESLUIT('hasAdditionalTaxRate')}),
    ({graph, base}) => extract({graph, base, find: DCT('description')}),
    ({graph, base}) => extract({graph, base, find: RDFS('comment')}),
    ({graph, base}) => extract({graph, base, find: DCT('hasPart')}),
    ({graph, base}) => taxRateAmount({graph, base}),
    ({graph, base}) => sessionStartedAtTime({graph, base}),
];

/**
 * Function will extract all needed properties for the given graph (triple-store) and subject (URI)
 *
 * @param graph (triple-store) to extract from
 * @param base start/base URI
 *
 * @returns {Property[]} all found properties
 */
export default function extractProperties({graph, base}) {
    return EXTRACTORS.flatMap(extractor => {
        return extractor({graph, base: new NamedNode(base)});
    })
}

/**
 * Function will extract all {@class Property} for the given path and map them to the given predicate.
 *
 * @param predicate to map to
 * @param path to follow to find the properties to map to the predicate
 *
 * @returns {Property[]} all found {@class Property}
 */
export function propertiesFor({predicate, path}) {
    let triples = [];

    path.forEach(step => {
        triples = step(triples);
    });

    return triples.flatMap(triple =>
        new Property({
            predicate: predicate,
            object: triple.object
        }))
}

/**
 * Function expresses a normal step of a path.
 *
 * @param graph - (triple-store/ttl-file) to extract from
 * @param base - start/base URI
 * @param find - the predicate to search properties/triples for
 * @param triples - a result set to start querying from
 *
 * @returns {triples[]}
 */
export function step({graph, base, find, triples}) {
    if (triples.length > 0) {
        return triples.flatMap(triple => graph.match(triple.object, find, undefined));
    } else if(base){
        return graph.match(base, find, undefined);
    } else {
       return [];
    }
}

/**
 * Function expresses an inverse step of a path.
 *
 * @param graph - (triple-store/ttl-file) to extract from
 * @param base - start/base URI
 * @param find - the predicate to search properties/triples for
 * @param triples - a result set to start querying from
 *
 * @returns {triples[]}
 */
export function inverseStep({graph, base, find, triples}) {
    let result;
    if (triples.length > 0) {
        result = triples.flatMap(triple => graph.match(undefined, find, triple.object));
    } else if(base){
        result = graph.match(undefined, find, base);
    } else {
        return [];
    }
    return result.map(t => triple(t.object, t.predicate, t.subject));
}