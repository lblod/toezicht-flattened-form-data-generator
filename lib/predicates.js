import passedBy from './predicates/passed-by.js';
import datePublication from './predicates/date-publication.js';

const EXTRACTORS = [
    passedBy,
    datePublication
];

export default function extract(graph) {
    return EXTRACTORS.map(extractor => {
        return extractor(graph);
    })
}