# toezicht-flattend-form-data-generator
Microservice that listens to the delta notifier and inserts the form data in the triple store if a form is submitted.

## Installation
Add the following snippet to your `docker-compose.yml`:

```yml
toezicht-flattened-form-data-generator:
  image: lblod/toezicht-flattend-form-data-generator
  volumes:
    - ./data/files/submissions:/share/submissions
```

The volume mounted in `/share/submissions` must contain the Turtle files containing the data harvested from the completed forms.

Configure the delta-notification service to send notifications on the `/delta` endpoint when an automatic submission task is ready for validation. Add the following snippet in the delta rules configuration of your project to make this possible:

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
```
POST /delta
```

Triggers the flat-mapping of the resources related submission-document and saves this as form-data into the triple-store.

The service is triggered by updates from the following resources:

 - type `meb:Submission`of which the `adms:status` is updated to `<http://lblod.data.gift/concepts/9bd8d86d-bb10-4456-a84e-91e9507c374c>`
 - type `melding:AutomaticSubmissionTask` of with the `adms:status` is updated to `<http://lblod.data.gift/automatische-melding-statuses/successful-concept>`

The `/delta` handling consists of 3 (major) steps:

1) Retrieve the linked ttl-file of type `<http://data.lblod.gift/concepts/form-data-file-type>` for the given resource.
2) Extract and flat-map the needed properties from the retrieved ttl-file.
3) Save the extracted, flat-mapped, properties to the triple-store as a resource of type `melding:FormData`.

```
PUT /flatten-submitted-document/:uuid
```

Triggers the flat-mapping of the submission-document for the given `uuid` and saves this as form-data into the triple-store.

The `/flatten-submitted-document/:uuid` handling consists of 3 (major) steps:

1) Retrieve the linked ttl-file of type `<http://data.lblod.gift/concepts/form-data-file-type>` for the given `uuid`.
2) Extract and flat-map the needed properties from the retrieved ttl-file.
3) Save the extracted, flat-mapped, properties to the triple-store as a resource of type `melding:FormData`.

### Current supported property flat-mapping

| Form-Data Property                          | Path to retrieve from in the TTL                        |
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