import {NamedNode} from 'rdflib';
import {DCT, ELI, ELOD, LBLOD_BESLUIT, RDF, RDFS} from "../util/namespaces";
import {Property} from "./property";
import taxRateAmount from "./extractors/tax-rate-amount";

const EXTRACTORS = [
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: RDF('type'), replacement: DCT('type')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: ELI('date_publication')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: ELI('passed_by')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: ELI('is_about')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: ELOD('financialYear')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: ELI('first_date_entry_in_force')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: ELI('date_no_longer_in_force')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: LBLOD_BESLUIT('authenticityType')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: LBLOD_BESLUIT('chartOfAccount')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: LBLOD_BESLUIT('taxType')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: LBLOD_BESLUIT('taxRate')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: LBLOD_BESLUIT('hasAdditionalTaxRate')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: DCT('description')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: RDFS('comment')}),
    ({graph, filters: {subject}}) => propertiesFor({graph,filters: {subject}, target: DCT('hasPart')}),
    ({graph, filters: {subject}}) => taxRateAmount({graph, filters: {subject}})
    // TODO ext:sessionStartedAtTime   -->    ^prov:generated/dct:subject/^besluit:behandelt/prov:startedAtTime
];

export default function extractProperties({graph, filters: {subject}}) {
    return EXTRACTORS.flatMap(extractor => {
        return extractor({graph, filters: {subject: new NamedNode(subject)}});
    })
}

/**
 *  Function will create an {@class Property} for each triple with the target predicate.
 *  If an replacement predicate was given, the {@class Property} will receive this as its predicate.
 *
 * @param graph - the graph to query for triples
 * @param subject
 * @param target - the predicate to search for
 * @param replacement - the predicate to replace with
 *
 * @returns {Property[]} list of al the extracted properties for the given graph and target.
 */
function propertiesFor({graph, filters: {subject}, target, replacement}) {
    const triples = graph.match(subject, target, undefined);
    return triples.flatMap(triple =>
        new Property({
            predicate: replacement ? replacement : target,
            object: triple.object
        }))
}