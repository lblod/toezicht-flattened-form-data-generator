import {NamedNode, triple} from 'rdflib';
import bodyParser from 'body-parser';
import {app} from 'mu';
import {
    createSubmissionFromSubmission,
    createSubmissionFromSubmissionResource, createSubmissionFromSubmissionTask, NotFound,
    SUBMISSION_SENT_STATUS, SUBMISSION_TASK_SUCCESSFUL
} from "./lib/submission";
import {FormData} from "./lib/form-data";
import {ADMS} from "./util/namespaces";
import {Delta} from "./lib/delta";

app.use(bodyParser.json({
    type: function (req) {
        return /^application\/json/.test(req.get('content-type'));
    }
}));

app.get('/', function (req, res) {
    res.send('Hello toezicht-flattened-form-data-generator');
});

app.post('/delta', async function (req, res) {

        const delta = new Delta(req.body);

        if (!delta.inserts.length) {
            console.log("Delta does not contain any insertions. Nothing should happen.");
            return res.status(204).send();
        }

        // TODO make it more easy to add new triggers <=> creation strategies.
        let submissions = [];
        try {
            submissions = await Promise.all(delta
                .getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_SENT_STATUS)))
                .map(async (triple) => await createSubmissionFromSubmission(triple.subject.value))
            );
            submissions = submissions.concat(
                await Promise.all(delta
                    .getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_TASK_SUCCESSFUL)))
                    .map(async triple => await createSubmissionFromSubmissionTask(triple.subject.value)))
            );
        } catch (e) {
            console.log(`Something went wrong while trying to retrieve/create the submissions.`);
            if (e instanceof NotFound) {
                console.log(`Reason: ${e.message}`);
                return res.status(204).send();
            }
            console.log(`Exception: ${e.stack}`);
            return res.status(500).send();
        }

        if (!submissions.length) {
            console.log("Delta does not contain any submission. Nothing should happen.");
            return res.status(204).send();
        }

        try {
            await Promise.all(
                submissions.map(async (submission) => await processSubmission(submission))
            );
        } catch (e) {
            console.log(`Something went wrong while trying to extract the form-data from the submissions`);
            console.log(`Exception: ${e.stack}`);
            return res.status(500).send();
        }

        return res.status(200).send({
            data: submissions.map(submission => submission.uri)
        });
    }
);

app.put('/flatten-submitted-document/:uuid', async function (req, res) {

    let submission;
    try {
        submission = await createSubmissionFromSubmissionResource(req.params.uuid);
    } catch (e) {
        console.log(`Something went wrong while trying to retrieve/create the submission.`);
        if (e instanceof NotFound) {
            console.log(`Reason: ${e.message}`);
            return res.status(204).send();
        }
        console.log(`Exception: ${e.stack}`);
        return res.status(500).send();
    }

    try {
        await processSubmission(submission);
    } catch (e) {
        console.log(`Something went wrong while trying to extract the form-data from the submission`);
        console.log(`Exception: ${e.stack}`);
        return res.status(500).send();
    }

    return res.status(200).send({data: submission.uri});
});

async function processSubmission(submission) {

    // we create a form with the needed properties
    const form = new FormData({submission});

    // we process the form, extracting the properties
    form.process();

    // save the form to the triple store
    await form.insert();

}