# toezicht-flattend-form-data-generator
Microservice that listens to the delta notifier and inserts the form data in the triple store if a form is submitted.

## Installation
Add the following snippet to your `docker-compose.yml`:

```yml
save-sent-submission:
  image: lblod/toezicht-flattend-form-data-generator
  volumes:
    - ./data/files/submissions:/share/submissions
```

The volume mounted in `/share/submissions` must contain the Turtle files containing the data harvested from the published documents. The resulting Turtle files to fill in the forms will also be written to this folder.

Configure the delta-notification service to send notifications on the `/delta` endpoint when an automatic submission task is read for validation. Add the following snippet in the delta rules configuration of your project:

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
        value: 'http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c'
      }
    },
    callback: {
      url: 'http://save-sent-submission/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true
    }
  },
]
```

## API
```
POST /delta
```

Triggers the flat-mapping of submissions that are being submitted.

The service is triggered by updates of resources of type `http://rdf.myexperiment.org/ontologies/base/Submission` of which the adms:status is updated to `<http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c>`(Send) .

The delta handling consists of 3 steps:

1) Retrieve the linked SubmissionDocument(TTL).
2) Extract and flat-map the needed properties from the retrieved SubmissionDocument.
3) Save the extracted flat-mapped properties to the triple-store as resource `melding:FormData`.


#### Current supported property mapping

| Property                          | Path in SubmittedDocument TTL                                     |
|-----------------------------------|-------------------------------------------------------------------|
| dct:type                          | rdf:type                                                          |
| eli:date_publication              | eli:date_publication                                              |
| eli:passed_by                     | eli:passed_by                                                     |
| eli:is_about                      | eli:is_about                                                      |
| elod:financialYear                | elod:financialYear                                                |
| eli:first_date_entry_in_force     | eli:first_date_entry_in_force                                     |
| eli:date_no_longer_in_force       | eli:date_no_longer_in_force                                       |
| lblodBesluit:authenticityType     | lblodBesluit:authenticityType                                     |
| lblodBesluit:chartOfAccount       | lblodBesluit:chartOfAccount                                       |
| lblodBesluit:taxRate              | lblodBesluit:taxRate                                              |
| lblodBesluit:taxType              | lblodBesluit:taxType                                              |
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

## Related services
The following services are also involved in the automatic processing of a submission:
* [automatic-submission-service](https://github.com/lblod/automatic-submission-service)
* [download-url-service](https://github.com/lblod/download-url-service)
* [validate-submission-service](https://github.com/lblod/validate-submission-service)
* [import-submissions-service](https://github.com/lblod/import-submission-service)