# toezicht-flattend-form-data-generator
Microservice that listens to the delta notifier and inserts/updates the form data as a flat object in the triple store.

## Installation
Add the following snippet to your `docker-compose.yml`:

```yml
toezicht-flattened-form-data-generator:
  image: lblod/toezicht-flattend-form-data-generator
  volumes:
    - ./data/files/submissions:/share/submissions
```

The volume mounted in `/share/submissions` must contain the Turtle files containing the data to fill in the forms.

Configure the delta-notification service to send notifications on the `/delta` endpoint by adding the following rules in `./delta/rules.js`:

```javascript
export default [
  {
    match: {
      predicate: {
        type: 'uri',
        value: 'http://www.w3.org/ns/adms#status'
      },
      object: {
        type: 'uri',
        value: 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c'  // sent status
      }
    },
    callback: {
      url: 'http://toezicht-flattened-form-data-generator/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true
    }
  },
  {
    match: {
      predicate: {
        type: "uri",
        value: "http://www.w3.org/ns/adms#status"
      },
      object: {
        type: "uri",
        value: "http://lblod.data.gift/automatische-melding-statuses/successful-concept"
      }
    },
    callback: {
      method: "POST",
      url: "http://save-sent-submission/delta"
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 1000,
      ignoreFromSelf: true
    }
  }
]
```

## API

### POST /delta
Triggers the flat-mapping of the resources related to a submission document and saves this as `melding:FormData` resource into the triple-store.

The service is triggered by updates from the following resources:

 - a submission is submitted. I.e. resource of type `meb:Submission`of which the `adms:status` is updated to `<http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c>`
 - an automatic submission resulted in a new concept submission. I.e. resource of type `melding:AutomaticSubmissionTask` of with the `adms:status` is updated to `<http://lblod.data.gift/automatische-melding-statuses/successful-concept>`

The `/delta` handling consists of 3 (major) steps:

1) Retrieve the linked ttl-file of type `<http://data.lblod.gift/concepts/form-data-file-type>` for the given resource.
2) Extract and flat-map the needed properties from the retrieved ttl-file.
3) Save the extracted, flat-mapped, properties to the triple-store as a resource of type `melding:FormData`.


### PUT /submission-documents/:uuid/flatten
Triggers the flat-mapping of the submission-document for the given `uuid` and saves this as form-data into the triple-store.

The `/submission-documents/:uuid/flatten` handling consists of 3 (major) steps:

1) Retrieve the linked ttl-file of type `<http://data.lblod.gift/concepts/form-data-file-type>` for the given `uuid`.
2) Extract and flat-map the needed properties from the retrieved ttl-file.
3) Save the extracted, flat-mapped, properties to the triple-store as a resource of type `melding:FormData`.

## Flat mapping
A `melding:FormData` resource is generated based on the data found in the TTL file. The table below lists the mapped property paths:

| FormData Property                          | Property path in TTL (starting from submission document) |
|-----------------------------------|-------------------------------------------------------------------|
| dct:type                          | rdf:type                                                          |
| eli:date_publication              | eli:date_publication                                              |
| eli:passed_by                     | eli:passed_by                                                     |
|                                   | ^besluit:heeftNotulen/besluit:isGehoudenDoor                      |
| eli:is_about                      | eli:is_about                                                      |
| elod:financialYear                | elod:financialYear                                                |
| eli:first_date_entry_in_force     | eli:first_date_entry_in_force                                     |
| eli:date_no_longer_in_force       | eli:date_no_longer_in_force                                       |
| lblodBesluit:authenticityType     | lblodBesluit:authenticityType                                     |
| lblodBesluit:chartOfAccount       | lblodBesluit:chartOfAccount                                       |
| lblodBesluit:taxRate              | lblodBesluit:taxRate                                              |
| lblodBesluit:hasAdditionalTaxRate | lblodBesluit:hasAdditionalTaxRate                                 |
| dct:description                   | dct:description                                                   |
| rdfs:comment                      | rdfs:comment                                                      |
| dct:hasPart                       | dct:hasPart                                                       |
| ext:taxRateAmount                 | lblodBesluit:taxRate/schema:price                                 |
| ext:sessionStartedAtTime          | ^prov:generated/dct:subject/^besluit:behandelt/prov:startedAtTime |
|                                   | ^besluit:heeftBesluitenlijst/prov:startedAtTime                   |
|                                   | ^besluit:heeftNotulen/prov:startedAtTime                          |
|                                   | ^besluit:heeftAgenda/prov:startedAtTime                           |
|                                   | ^besluit:heeftUittreksel/prov:startedAtTime                       |
| ext:decisionType                  | rdf:type (that is part of the decision-type concept-scheme)       |
| ext:regulationType                | rdf:type (that is part of the regulation-type concept-scheme)     |
| ext:taxType                       | rdf:type (that is part of the tax-type concept-scheme)            |

## Related services
The following services are also involved in the automatic processing of a submission:
* [automatic-submission-service](https://github.com/lblod/automatic-submission-service)
* [download-url-service](https://github.com/lblod/download-url-service)
* [import-submissions-service](https://github.com/lblod/import-submission-service)
* [enrich-submission-service](https://github.com/lblod/enrich-submission-service)
* [validate-submission-service](https://github.com/lblod/validate-submission-service)
