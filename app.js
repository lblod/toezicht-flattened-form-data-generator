require('require-context/register');

import {app} from 'mu';
import {TurtleFile} from "./lib/turtle-file";
import {Form} from "./lib/form";

const OLD_URI = "http://data.lblod.info/forms/meldingsplicht/0711f911-4c75-4097-8cad-616fef08ffcd";
const TEST_FORM_PATH = "/app/util/form-example.ttl";

app.get('/', function (req, res) {
    res.send('Hello toezicht-flattened-form-data-generator');
});

app.post('/delta', async function (req, res, next) {

    // TODO find the submission doc/file URI related to the submission following the path `?submission dct:subject ?submittedDocument`
    // TODO retrieve the ttl file of the submitted submission. Make sure it is of type `<http://data.lblod.gift/concepts/form-data-file-type>`


    // submitted ttl
    const submission = await new TurtleFile().read(TEST_FORM_PATH);

    // the new form(-data)
    const form = new Form(submission);

    form.process();

    // save the new form
    form.insert();

});