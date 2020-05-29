import {NamedNode, triple} from 'rdflib';
import bodyParser from 'body-parser';
import {app} from 'mu';
import {
    createSubmissionFromSubmission,
    createSubmissionFromSubmissionResource,
    createSubmissionFromSubmissionTask,
    SUBMISSION_SENT_STATUS,
    SUBMISSION_TASK_SUCCESSFUL
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

    const submissions =  await processInsertions(delta);

    if (!submissions) {
        return res.status(204).send();
    } else {
        return res.status(200).send();
    }
});

app.put('/submission-documents/:uuid/flatten', async function (req, res) {
    let submission;
    try {
        submission = await createSubmissionFromSubmissionResource(req.params.uuid);
        if (submission)
            await processSubmission(submission);

        return res.status(204).send();
    } catch (e) {
        console.log(`Something went wrong while flattening the submission.`);
        console.log(`Exception: ${e.stack}`);
        return res.status(500).send();
    }
});

async function processInsertions(delta) {
    // TODO make it more easy to add new triggers <=> creation strategies.
    let submissions = [];

    // get submissions for submission URIs
    let inserts = delta.getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_SENT_STATUS)));
    for(let triple of inserts) {
        const submission = await createSubmissionFromSubmission(triple.subject.value);
        if (submission)
            submissions.push(submission);
    }

    // get submissions for submission-task URIs
    inserts = delta.getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_TASK_SUCCESSFUL)));
    for(let triple of inserts) {
        const submission = await createSubmissionFromSubmissionTask(triple.subject.value);
        if (submission)
            submissions.push(submission);
    }

    if (submissions.length) {
        processSubmissions(submissions); // don't await async processing
    }
    return submissions;
}

async function processSubmissions(submissions) {
    for(let submission of submissions) {
        try {
            await processSubmission(submission);
        } catch (e) {
            console.log(`Something went wrong while trying to extract the form-data from the submissions`);
            console.log(`Exception: ${e.stack}`);
        }
    }
}

async function processSubmission(submission) {
    const form = new FormData({submission});
    await form.flatten();
}