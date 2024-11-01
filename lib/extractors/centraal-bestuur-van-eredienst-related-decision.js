import { DCT, RDF } from '../../util/namespaces';
import { default as defaultExtract } from './default-extractor';

export default function extract({ graph, base }) {
  const matchingList = [
    'https://data.vlaanderen.be/id/concept/BesluitDocumentType/18833df2-8c9e-4edd-87fd-b5c252337349',
    'https://data.vlaanderen.be/id/concept/BesluitDocumentType/672bf096-dccd-40af-ab60-bd7de15cc461',
    'https://data.vlaanderen.be/id/concept/BesluitDocumentType/2c9ada23-1229-4c7e-a53e-acddc9014e4e',
    'https://data.vlaanderen.be/id/concept/BesluitDocumentType/ce569d3d-25ff-4ce9-a194-e77113597e29',
  ];
  const types = defaultExtract({ graph, base, find: RDF('type') });

  if (types.find((prop) => matchingList.includes(prop.object.value))) {
    return defaultExtract({ graph, base, find: DCT('relation') });
  } else {
    return [];
  }
}
