import flatten from 'lodash.flatten';
import {app} from 'mu';
import {Submission, SUBMISSION_SENT_STATUS} from "./lib/submission";
import {FormData} from "./lib/form-data";
import {ADMS} from "./util/namespaces";
import {TurtleFile} from "./lib/turtle-file";

const MOCK_SUBMISSION_URI = "http://data.lblod.info/submissions/5E58DEC8A438D00008000002";
const MOCK_SUBMISSION_DOCUMENT_URI = "http://data.aarschot.be/besluitenlijsten/fd7be360-e049-11e9-8062-a3515a413ddd";
const TTL_MOCK_LOCATION = "/app/resources/c2361940-549f-11ea-8a41-713ef8cb6beb.ttl";

app.get('/', function (req, res) {
    res.send('Hello toezicht-flattened-form-data-generator');
});

// Mock implementation of the form processing
app.get('/delta', async function (req, res, next) {

    // retrieve/create the submission
    const submission = await new Submission({
        uri: MOCK_SUBMISSION_URI,
        // submittedDocument: new TurtleFile({
        //     uri: MOCK_SUBMISSION_DOCUMENT_URI,
        //     location: TTL_MOCK_LOCATION
        // })
    }).load();

    // we create a form with the needed properties
    const form = new FormData({submission});

    // we process the form, extracting the properties
    form.process();

    // save the form to the triple store
    form.insert();

    // finish the call
    return res.status(200);
});


app.post('/delta', async function (req, res, next) {
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
                    let form = new FormData(submission);
                    form.process();
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

function getSentSubmissions(delta) {
    const inserts = flatten(delta.map(changeSet => changeSet.inserts));
    return inserts.filter(isTriggerTriple).map(t => t.subject.value);
}

function isTriggerTriple(triple) {
    return triple.predicate === ADMS('status').value
        && triple.object.value === SUBMISSION_SENT_STATUS;
}