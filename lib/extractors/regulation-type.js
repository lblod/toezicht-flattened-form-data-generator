import { default as defaultExtract } from './default-extractor';
import { EXT, RDF } from '../../util/namespaces';

export default function extract({ graph, base, tmp }) {
  const types = defaultExtract({
    graph,
    base,
    find: RDF('type'),
    replaceWith: EXT('regulationType'),
  });
  return types.filter((prop) => tmp.cl.regulations.includes(prop.object.value));
}
