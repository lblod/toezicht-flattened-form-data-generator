import {
    sparqlEscapeString,
    sparqlEscapeUri,
    sparqlEscapeInt,
    sparqlEscapeFloat,
    sparqlEscapeDate,
    sparqlEscapeDateTime,
    sparqlEscapeBool,
} from 'mu';

const DATE = "http://www.w3.org/2001/XMLSchema#date";
const DATETIME = "http://www.w3.org/2001/XMLSchema#datetime";
// TODO is this correct?
const BOOL = "http://www.w3.org/2001/XMLSchema#bool";
const FLOAT = "http://www.w3.org/2001/XMLSchema#decimal";
const INT = "http://www.w3.org/2001/XMLSchema#integer";
const STRING = "http://www.w3.org/2001/XMLSchema#string";


export function sparqlEscapeRDFLibObject(object) {
    if (object.termType === "NamedNode") {
        return sparqlEscapeUri(object.value)
    } else {
        switch (object.datatype.value) {
            case DATE:
                return sparqlEscapeDate(object.value);
            case DATETIME:
                return sparqlEscapeDateTime(object.value);
            case BOOL:
                return sparqlEscapeBool(object.value);
            case FLOAT:
                return sparqlEscapeFloat(object.value);
            case INT:
                return sparqlEscapeInt(object.value);
            case STRING:
                return sparqlEscapeString(object.value);
            default:
                return sparqlEscapeString(object.value)

        }
    }
}