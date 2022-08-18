import { LBLOD_BESLUIT } from '../../util/namespaces';
import { default as defaultExtract } from './default-extractor';

export default function extract({ graph, base, tmp }) {
  const types = defaultExtract({ graph, base, find: LBLOD_BESLUIT('AdoptionType') });
  return types.filter((prop) => tmp.cl.adoptionTypes.includes(prop.object.value));
}
