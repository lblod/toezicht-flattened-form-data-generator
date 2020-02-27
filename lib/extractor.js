import {NamedNode, triple} from 'rdflib';
import {BESLUIT, DCT, ELI, ELOD, LBLOD_BESLUIT, PROV, RDF, RDFS, SCHEMA} from "../util/namespaces";
import {Property} from "./property";
import taxRateAmount from "./extractors/tax-rate-amount";
import sessionStartedAtTime from "./extractors/session-started-at-time";
import {Triple} from "./triple";

const EXTRACTORS = [
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate:  RDF('type')}), replacement: new Triple( {predicate: DCT('type')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: ELI('date_publication') })}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: ELI('passed_by')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: ELI('is_about')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: ELOD('financialYear')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: ELI('first_date_entry_in_force')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: ELI('date_no_longer_in_force')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: LBLOD_BESLUIT('authenticityType') })}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: LBLOD_BESLUIT('chartOfAccount')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: LBLOD_BESLUIT('taxType')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: LBLOD_BESLUIT('taxRate')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: LBLOD_BESLUIT('hasAdditionalTaxRate')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: DCT('description')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: RDFS('comment')})}),
    ({graph, triple: {subject}}) => propertiesFor({graph, filter: new Triple({subject, predicate: DCT('hasPart')})}),
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
function propertiesFor({graph, filter, replacement}) {
    const triples = graph.match(filter.subject, filter.predicate, undefined);
    return triples.flatMap(triple =>
        new Property({
            predicate: replacement ? replacement.predicate : filter.predicate,
            object: triple.object
        }))
}

// let triples = graph.match(filter.subject, LBLOD_BESLUIT('taxRate'), undefined);
// triples = triples.flatMap(triple => graph.match(triple.object, SCHEMA('price'), undefined));

// INVERSE
// triples = graph.match(undefined, PROV('generated'),filter.object);
// STEP
// triples = triples.flatMap(triple => graph.match(triple.subject, DCT('subject'), undefined));
// INVERSE
// triples = triples.flatMap(triple => graph.match(undefined, BESLUIT('behandelt'), triple.object));
// STEP
// triples = triples.flatMap(triple => graph.match(triple.subject, PROV('startedAtTime'), undefined));

export function propFor({path, predicate}) {
    let triples;
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
    if(triples){
        return triples.flatMap(triple => graph.match(triple.object, filter.predicate, undefined));
    } else {
        return graph.match(filter.subject,filter.predicate, undefined);
    }

}

export function inverseStep({graph, triples, filter}) {
    let result;
    if(triples){
        result = triples.flatMap(triple => graph.match(undefined, filter.predicate, triple.object));
    } else {
        result = graph.match(undefined,filter.predicate, filter.object);
    }
    return result.map(t => triple(t.object, t.predicate, t.subject));
}