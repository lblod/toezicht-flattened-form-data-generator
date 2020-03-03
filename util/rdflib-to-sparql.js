import {
    sparqlEscapeString,
    sparqlEscapeUri,
    sparqlEscapeInt,
    sparqlEscapeFloat,
    sparqlEscapeDate,
    sparqlEscapeDateTime,
    sparqlEscapeBool,
} from 'mu';
import {XSD} from "./namespaces";

const DATE = XSD('date').value;
const DATETIME = XSD('dateTime').value;
const BOOL = XSD('boolean').value;
const FLOAT = XSD('decimal').value;
const INT = XSD('integer').value;
const STRING = XSD('string').value;


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