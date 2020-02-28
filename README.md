# toezicht-flattend-form-data-generator
Microservice that listens to the delta notifier and inserts the form data in the triple store if a form is submitted.

## Installation
Add the following snippet to your `docker-compose.yml`:

```yml
save-sent-submission:
  image: lblod/save-sent-submission
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

// TODO when finalized