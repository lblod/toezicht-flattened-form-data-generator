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

export default function extractProperties({graph, triple: {subject}}) {
    return EXTRACTORS.flatMap(extractor => {
        return extractor({graph, triple: {subject: new NamedNode(subject)}});
    })
}

/**
 *  Function will create an {@class Property} for each triple with the target predicate.
 *  If an replacement predicate was given, the {@class Property} will receive this as its predicate.
 *
 * @param graph - the graph to query for triples
 * @param filter - the triple to filter on
 * @param replacement - the triple to replace with
 *
 * @returns {Property[]} list of al the extracted properties for the given graph and target.
 */
// function propertiesFor({graph, filter, replacement}) {
//     const triples = graph.match(filter.subject, filter.predicate, undefined);
//     return triples.flatMap(triple =>
//         new Property({
//             predicate: replacement ? replacement.predicate : filter.predicate,
//             object: triple.object
//         }))
// }

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

export function step({graph, triples, filter}) {
    if (triples.length > 0) {
        return triples.flatMap(triple => graph.match(triple.object, filter.predicate, undefined));
    } else if(filter.subject){
        return graph.match(filter.subject, filter.predicate, undefined);
    } else {
       return [];
    }

}

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