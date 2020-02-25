import {DCT, ELI, ELOD, LBLOD_BESLUIT, RDF, RDFS, SCHEMA} from "../util/namespaces";
import {Property} from "./property";

const EXTRACTORS = [
    // TODO put the replacement in to namespaces?
    (graph) => simpleExtractor({graph, target: RDF('type'), replacement: "http://purl.org/dc/terms/type"}),
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
    // TODO ext:taxRateAmount   -->    lblodBesluit:taxRate/schema:price
    // (graph) => simpleExtractor({graph, target: [LBLOD_BESLUIT('taxRate'), SCHEMA('price')]}),
    // TODO ext:sessionStartedAtTime   -->    ^prov:generated/dct:subject/^besluit:behandelt/prov:startedAtTime
];

export default function extract(graph) {
    return EXTRACTORS.flatMap(extractor => {
        return extractor(graph);
    })
}

function simpleExtractor({graph, target, replacement = undefined, flatten = false}) {
    const triples = graph.match(undefined, target, undefined);
    return triples.map(triple => new Property(
        // TODO should be target if no replacement was given
        replacement ? replacement : triple.predicate.value,
        flatten ? getLiteral({graph, triple}).object.value : triple.object.value)
    );
}

function getLiteral({graph, triple}) {
    if (triple.object.termType === "Literal") {
        return triple;
    } else {
        return getLiteral({
            // TODO should be improved to account for array
            triple: graph.match(triple.object, undefined, undefined)[0],
            graph
        });
    }
}

//  } else {
//      console.log("there was an array target!! :D");
//      const triples = graph.match(undefined, target[0], undefined);
//      for (let i = 1; i < target.length; i++) {
//          triples.flatMap(triple => graph.match(triple.subject, target[i], undefined));
//      }
//      return triples.map(triple => new Property(
//          // TODO should be target if no replacement was given
//          replacement ? replacement : triple.predicate.value,
//          triple.object.value,
//      ));
//  }