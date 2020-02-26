import {Submission} from "./lib/submission";

require('require-context/register');

import {app} from 'mu';
import {TurtleFile} from "./lib/turtle-file";
import {Form} from "./lib/form";

const MOCK_URI = "http://data.lblod.info/forms/meldingsplicht/0711f911-4c75-4097-8cad-616fef08ffcd";
const TTL_MOCK_LOCATION = "/app/util/form-example.ttl";

app.get('/', function (req, res) {
    res.send('Hello toezicht-flattened-form-data-generator');
});

// Mock implementation of the form processing
app.get('/delta', async function (req, res, next) {

    const submission = await new Submission({
        uri: MOCK_URI,
        ttlPath: TTL_MOCK_LOCATION
    }).load();

    // we create a form with the needed properties
    const form = new Form({submission});

    // we process the form, extracting the properties
    form.process();

    // save the form to the triple store
    form.insert();

    // finish the call
    return res.status(200);
});

// TODO work the task correctly, retrieving it and updating the state.
// TODO find the submission doc/file URI related to the submission following the path `?submission dct:subject ?submittedDocument`
// TODO retrieve the ttl file of the submitted submission. Make sure it is of type `<http://data.lblod.gift/concepts/form-data-file-type>`
// TODO process the ttl/submission with real data
app.post('/delta', async function (req, res, next) {
    // TODO
    const sentSubmissions = getSentSubmissions(req.body);

    if (!sentSubmissions.length) {
        console.log("Delta does not contain an submission with status 'verstuurd'. Nothing should happen.");
        return res.status(204).send();
    }

    for (let submissionUri of sentSubmissions) {
        try {
            const submission = await new Submission({
                uri: submissionUri
            }).load();

            const handleSubmission = async () => {
                try {
                    let form = new Form(submission);
                    form.process();
                    form.insert();
                } catch (e) {
                    console.log("something went wrong while processing submission")
                }
            };

            handleSubmission(); // async processing
        } catch (e) {
            console.log(`Something went wrong while handling deltas for automatic submission task ${task}`);
            console.log(e);
            return next(e);
        }
    }
    return res.status(200).send({ data: sentSubmissions });
});