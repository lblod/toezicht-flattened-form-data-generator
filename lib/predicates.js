
import {DCT, ELI, ELOD, LBLOD_BESLUIT, RDF, RDFS} from "../util/namespaces";
import {Property} from "./property";

const EXTRACTORS = [
    (graph) => flat({graph, target: RDF('type'), replacement: "http://purl.org/dc/terms/type"}),
    (graph) => flat({graph, target: ELI('date_publication')}),
    (graph) => flat({graph, target: ELI('passed_by')}),
    (graph) => flat({graph, target: ELI('is_about')}),
    (graph) => flat({graph, target: ELOD('financialYear')}),
    (graph) => flat({graph, target: ELI('first_date_entry_in_force')}),
    (graph) => flat({graph, target: ELI('date_no_longer_in_force')}),
    (graph) => flat({graph, target: LBLOD_BESLUIT('authenticityType')}),
    (graph) => flat({graph, target: LBLOD_BESLUIT('chartOfAccount')}),
    (graph) => flat({graph, target: LBLOD_BESLUIT('taxRate')}),
    (graph) => flat({graph, target: LBLOD_BESLUIT('taxType')}),
    (graph) => flat({graph, target: LBLOD_BESLUIT('hasAdditionalTaxRate')}),
    (graph) => flat({graph, target: DCT('description')}),
    (graph) => flat({graph, target: RDFS('comment')}),
    // TODO what about the linked part???
    (graph) => flat({graph, target: DCT('hasPart')}),
    // TODO ext:taxRateAmount   -->    lblodBesluit:taxRate/schema:price
    // TODO ext:sessionStartedAtTime   -->    ^prov:generated/dct:subject/^besluit:behandelt/prov:startedAtTime
];

export default function extract(graph) {
    return EXTRACTORS.flatMap(extractor => {
        return extractor(graph);
    })
}

function flat({graph, target, replacement}) {
    const triples = graph.match(undefined, target, undefined);
    return triples.map(triple => new Property(
        replacement ? replacement : triple.predicate.value,
        triple.object.value,
    ));
}