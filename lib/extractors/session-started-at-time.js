import { DCT, EXT, PROV, BESLUIT } from '../../util/namespaces';
import { inverseStep, propertiesFor, step } from '../extractor';

export default function extract({ graph, base }) {
  let properties = propertiesFor({
    predicate: EXT('sessionStartedAtTime'),
    path: [
      (triples) => inverseStep({ graph, base, find: PROV('generated'), triples }),
      (triples) => step({ graph, triples, find: DCT('subject') }),
      (triples) => inverseStep({ graph, triples, find: BESLUIT('behandelt') }),
      (triples) => step({ graph, triples, find: PROV('startedAtTime') }),
    ],
  });

  let besluitenPredicates = ['heeftBesluitenlijst', 'heeftNotulen', 'heeftAgenda', 'heeftUittreksel'];

  properties = properties.concat(
    besluitenPredicates.flatMap((predicate) =>
      propertiesFor({
        predicate: EXT('sessionStartedAtTime'),
        path: [
          (triples) => inverseStep({ graph, base, find: BESLUIT(predicate), triples }),
          (triples) => step({ graph, find: PROV('startedAtTime'), triples })
        ],
      })
    )
  );

  return properties;
}
