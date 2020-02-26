require('require-context/register');

import {app} from 'mu';
import {TurtleFile} from "./lib/turtle-file";
import {Form} from "./lib/form";

const MOCK_URI = "http://data.lblod.info/forms/meldingsplicht/0711f911-4c75-4097-8cad-616fef08ffcd";
const TTL_MOCK_LOCATION = "/app/util/form-example.ttl";

app.get('/', function (req, res) {
    res.send('Hello toezicht-flattened-form-data-generator');
});

app.post('/delta', async function (req, res, next) {

    // TODO find the submission doc/file URI related to the submission following the path `?submission dct:subject ?submittedDocument`
    // TODO retrieve the ttl file of the submitted submission. Make sure it is of type `<http://data.lblod.gift/concepts/form-data-file-type>`


    // submitted ttl
    const submissionUri = MOCK_URI;
    const submissionTTL = await new TurtleFile({location: TTL_MOCK_LOCATION}).read();

    // the new form(-data)
    const form = new Form(submissionUri, submissionTTL);

    form.process();

    // save the new form
    form.insert();

});