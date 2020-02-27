import {NamedNode, triple} from 'rdflib';
import {DCT, ELI, ELOD, LBLOD_BESLUIT, RDF, RDFS} from "../util/namespaces";
import {Property} from "./property";
import defaultExtract from "./extractors/default-extract"
import taxRateAmount from "./extractors/tax-rate-amount";
import sessionStartedAtTime from "./extractors/session-started-at-time";

const EXTRACTORS = [
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: RDF('type'), replace: DCT('type')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: ELI('date_publication')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: ELI('passed_by')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: ELI('is_about')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: ELI('first_date_entry_in_force')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: ELI('date_no_longer_in_force')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: ELOD('financialYear')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: LBLOD_BESLUIT('authenticityType')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: LBLOD_BESLUIT('chartOfAccount')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: LBLOD_BESLUIT('taxType')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: LBLOD_BESLUIT('taxRate')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: LBLOD_BESLUIT('hasAdditionalTaxRate')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: DCT('description')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: RDFS('comment')}),
    ({graph, triple: {subject}}) => defaultExtract({graph, subject, predicate: DCT('hasPart')}),
    ({graph, triple: {subject}}) => taxRateAmount({graph, subject}),
    ({graph, triple: {subject}}) => sessionStartedAtTime({graph, subject}),
];

/**
 * Function will extract all needed properties for the given graph (triple-store) and subject (URI)
 * @param graph (triple-store) to extract from
 * @param subject start/base URI
 *
 * @returns {Property[]} all found properties
 */
export default function extractProperties({graph, triple: {subject}}) {
    return EXTRACTORS.flatMap(extractor => {
        return extractor({graph, triple: {subject: new NamedNode(subject)}});
    })
}

/**
 * Function will extract all {@class Property} for the given path and map them to the given predicate.
 *
 * @param path to follow to find the properties
 * @param predicate to map to
 *
 * @returns {Property[]} all found {@class Property}
 */
export function propertiesFor({path, predicate}) {
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
 * @param graph (triple-store) to extract from
 * @param triples we not to filter/query from
 * @param filter start filter if no triples where given
 *
 * @returns {triples[]}
 */
export function step({graph, triples, filter}) {
    if (triples.length > 0) {
        return triples.flatMap(triple => graph.match(triple.object, filter.predicate, undefined));
    } else if(filter.subject){
        return graph.match(filter.subject, filter.predicate, undefined);
    } else {
       return [];
    }

}

/**
 * Function expresses an inverse step of a path.
 *
 * @param graph (triple-store) to extract from
 * @param triples we not to filter/query from
 * @param filter start filter if no triples where given
 *
 * @returns {triples[]}
 */
export function inverseStep({graph, triples, filter}) {
    let result;
    if (triples.length > 0) {
        result = triples.flatMap(triple => graph.match(undefined, filter.predicate, triple.object));
    } else if(filter.subject){
        result = graph.match(undefined, filter.predicate, filter.subject);
    } else {
        return [];
    }
    return result.map(t => triple(t.object, t.predicate, t.subject));
}