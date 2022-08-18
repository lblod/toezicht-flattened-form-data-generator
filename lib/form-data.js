import { uuid } from 'mu';
import extractProperties from './extractor';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import {
  completeFormDataFromSubmissionQuery,
  insertFormDataQuery,
  deleteFormDataQuery,
} from '../util/queries';

export class FormData {
  constructor({ submission }) {
    this.submission = submission;
    this.properties = [];
  }

  async flatten() {
    const result = await query(completeFormDataFromSubmissionQuery(this.submission.uri));
    const isNew = result.results.bindings.length == 0;
    if (isNew) {
      console.log(`No form data found for submission <${this.submission.uri}>. Going to create a  new flattened form data resource.`);
      this.uuid = uuid();
      this.uri = `http://data.lblod.info/form-data/${this.uuid}`;
    } else {
      const binding = result.results.bindings[0];
      this.uri = binding['formDataURI'].value;
      this.uuid = binding['formDataUUID'].value;
    }

    // we process the form, extracting the properties
    this.properties = await extractProperties({
      graph: this.submission.ttl,
      base: this.submission.resourceURI,
    });

    if (!isNew) {
      const q = deleteFormDataQuery(this.uri);
      await update(q);
    }

    // insert flattened resource in triplestore
    const q = insertFormDataQuery({
      uri: this.uri,
      uuid: this.uuid,
      submission: this.submission,
      properties: this.properties,
    });
    await update(q);
  }
}
