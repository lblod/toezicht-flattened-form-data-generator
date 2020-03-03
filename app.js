import {NamedNode, triple} from 'rdflib';
import bodyParser from 'body-parser';
import {app} from 'mu';
import {
    createSubmissionFromSubmission,
    createSubmissionFromSubmissionResource, createSubmissionFromSubmissionTask,
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

app.post('/delta', async function (req, res, next) {

        // TODO exception handling
        const delta = new Delta(req.body);

        if (!delta.inserts.length) {
            console.log("Delta does not contain an insertions. Nothing should happen.");
            return res.status(204).send();
        }

        // TODO can this be done better?
        // TODO very buggy because of map and async request
        let submissions = [];
        try {
            submissions = await Promise.all(delta
                .getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_SENT_STATUS)))
                .map(async (triple) => await createSubmissionFromSubmission(triple.subject.value))
            );
        } catch (e) {
            console.log(`Something went wrong while trying to create the submissions.`);
            console.log(`Exception: ${e.stack}`);
            return res.status(500).send();
        }
        // submissions = submissions.concat(
        //     await Promise.all(delta.getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_TASK_SUCCESSFUL))).map(async triple => await createSubmissionFromSubmissionTask(triple.subject.value)))
        // );

        if (!submissions.length) {
            console.log("Delta does not contain an submission. Nothing should happen.");
            return res.status(204).send();
        }

        for (let submission of submissions) {
            await processSubmission({res, submission})
        }

        return res.status(200).send({
            data: submissions.map(submission => submission.uri)
        });
    }
);

// TODO add PUT call
app.put('/:uuid', async function (req, res, next) {

    // TODO exception handling
    const submission = await createSubmissionFromSubmissionResource(req.params.uuid);

    await processSubmission({res, submission});

    return res.status(200);
});

async function processSubmission({res, submission}) {

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
}