import flatten from 'lodash.flatten';
import bodyParser from 'body-parser';
import {app} from 'mu';
import {createSubmissionByURI, SUBMISSION_SENT_STATUS} from "./lib/submission";
import {FormData} from "./lib/form-data";
import {ADMS} from "./util/namespaces";

const MOCK_SUBMISSION_URI = "http://data.lblod.info/submissions/5E58DEC8A438D00008000002";
const MOCK_SUBMISSION_DOCUMENT_URI = "http://data.aarschot.be/besluitenlijsten/fd7be360-e049-11e9-8062-a3515a413ddd";
const TTL_MOCK_LOCATION = "/app/resources/c2361940-549f-11ea-8a41-713ef8cb6beb.ttl";

app.use(bodyParser.json({ type: function(req) { return /^application\/json/.test(req.get('content-type')); } }));

app.get('/', function (req, res) {
    res.send('Hello toezicht-flattened-form-data-generator');
});

// Mock implementation of the form processing
// app.get('/delta', async function (req, res, next) {
//     const uri = MOCK_SUBMISSION_URI;
//     processSubmission({res, uri});
// });


// TODO implement and test the delta flow
app.post('/delta', async function (req, res, next) {
    let sentSubmissions;
    try {
        console.log(req.body);
        sentSubmissions = getSentSubmissions(req.body);
    }catch(e){
        console.log("Something went wrong while trying to process the delta notifier request.");
        console.log(`Exception: ${e.stack}`);
        return res.status(500).send();
    }

    if (!sentSubmissions.length) {
        console.log("Delta does not contain an submission with status 'verstuurd'. Nothing should happen.");
        return res.status(204).send();
    }

    for (let submissionUri of sentSubmissions) {
        processSubmission({res, uri: submissionUri})
    }

    return res.status(200).send({data: sentSubmissions});
});

function getSentSubmissions(delta) {
    const inserts = flatten(delta.map(changeSet => changeSet.inserts));
    return inserts.filter(isTriggerTriple).map(t => t.subject.value);
}

function isTriggerTriple(triple) {
    return triple.predicate.value === ADMS('status').value
        && triple.object.value === SUBMISSION_SENT_STATUS;
}

async function processSubmission({res, uri}) {
    // retrieve/create the submission
    let submission;
    try {
        submission = await createSubmissionByURI(uri);
    } catch (e) {
        console.log(`Something went wrong while trying to retrieve submission <${uri}>`);
        console.log(`Exception: ${e.stack}`);
        return res.status(500).send();
    }

    // we create a form with the needed properties
    const form = new FormData({submission});

    // we process the form, extracting the properties
    try {
        form.process();
    } catch (e) {
        console.log(`Something went wrong while trying to extract the form-data from submission <${uri}>`);
        console.log(`Exception: ${e.stack}`);
        return res.status(500).send();
    }

    // save the form to the triple store
    try {
        await form.insert();
    } catch (e) {
        console.log(`Something went wrong while trying to save the form-data from submission <${uri}>, check your database connection?`);
        console.log(`Exception: ${e.stack}`);
        return res.status(500).send();
    }

    // finish the call
    return res.status(200).send();
}