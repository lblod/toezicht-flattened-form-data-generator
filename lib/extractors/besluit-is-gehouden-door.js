import { ELI, BESLUIT } from '../../util/namespaces';
import { inverseStep, propertiesFor, step } from '../extractor';

export default function extract({ graph, base }) {
  let properties = propertiesFor({
    predicate: ELI('passed_by'),
    path: [
      (triples) => inverseStep({graph, base, find: BESLUIT('heeftNotulen'), triples}),
      (triples) => step({graph, triples, find: BESLUIT('isGehoudenDoor')}),
    ]
  });
  return properties;
}
