import {default as defaultExtract} from './default-extractor';
import {EXT, RDF} from "../../util/namespaces";

export default function extract({graph, base, tmp}) {
  const types = defaultExtract({graph, base, find: RDF('type'), replaceWith: EXT('taxType')});
  return types.filter(prop => tmp.cl.taxTypes.includes(prop.object.value));
}