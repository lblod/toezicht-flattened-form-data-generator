import { default as defaultExtract } from './default-extractor';
import { EXT, RDF } from '../../util/namespaces';

export default function extract({ graph, base, tmp }) {
  const types = defaultExtract({
    graph,
    base,
    find: RDF('type'),
    replaceWith: EXT('decisionType'),
  });
  return types.filter((prop) => tmp.cl.decisions.includes(prop.object.value));
}
