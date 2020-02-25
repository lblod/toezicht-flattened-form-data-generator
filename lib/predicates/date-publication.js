import {Property} from "../property";
import {ELI} from "../../util/namespaces";

export default function extract(graph) {
    const triples = graph.match(undefined, ELI("date_publication"), undefined);
    return triples.map(triple => new Property(triple.predicate.value, triple.object.value));
}