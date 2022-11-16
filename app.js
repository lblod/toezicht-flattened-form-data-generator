import { NamedNode, triple } from 'rdflib';
import bodyParser from 'body-parser';
import { app } from 'mu';
import {
  createSubmissionFromSubmissionResource,
  createSubmissionFromSubmissionTask,
  createSubmissionFromSubmission,
  SUBMISSION_SENT_STATUS,
} from './lib/submission';
import { FormData } from './lib/form-data';
import { TASK, ADMS } from './util/namespaces';
import { Delta } from './lib/delta';
import * as env from './env.js';
import { updateTaskStatus } from './lib/submission-task.js';
import { saveError } from './lib/submission-error.js';

app.use(
  bodyParser.json({
    type: function (req) {
      return /^application\/json/.test(req.get('content-type'));
    },
  })
);

app.get('/', function (req, res) {
  res.send('Hello toezicht-flattened-form-data-generator');
});

app.post('/automatic/delta', async function (req, res) {
  //We can already send a 200 back. The delta-notifier does not care about the result, as long as the request is closed.
  res.status(200).send();

  try {
    const delta = new Delta(req.body);

    //Collect the triples about that form-data-generate operation of a task
    const relevantTaskTriples = delta.getInsertsFor(
      triple(
        undefined,
        TASK('operation'),
        new NamedNode(env.FORM_DATA_GENERATE_OPERATION)
      )
    );

    for (const triple of relevantTaskTriples) {
      const taskUri = triple.subject.value;
      try {
        await updateTaskStatus(taskUri, env.TASK_ONGOING_STATUS);

        const submission = await createSubmissionFromSubmissionTask(taskUri);
        await processSubmission(submission);

        await updateTaskStatus(taskUri, env.TASK_SUCCESS_STATUS);
      } catch (error) {
        const message = `Something went wrong while generating form data for task ${taskUri}`;
        console.error(`${message}\n`, error.message);
        console.error(error);
        const errorUri = await saveError({ message, detail: error.message });
        await updateTaskStatus(taskUri, env.TASK_FAILURE_STATUS, errorUri);
      }
    }

    //Deletions will never get here. The delta-notifier was set up to only forward SENT and CONCEPT submission.
    //Is this a relic from the past?
    //const deletions = await processDeletions(delta);
  } catch (error) {
    const message =
      'The task for generating form data for a submission could not even be started or finished due to an unexpected problem.';
    console.error(`${message}\n`, error.message);
    console.error(error);
    await saveError({ message, detail: error.message });
  }
});

app.post('/manual/delta', async function (req, res) {
  //We can already send a 200 back. The delta-notifier does not care about the result, as long as the request is closed.
  res.status(200).send();

  try {
    const delta = new Delta(req.body);

    //Collect the triples about a submission that is sent
    const relevantSubmissionTriples = delta.getInsertsFor(
      triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_SENT_STATUS))
    );
    for (const triple of relevantSubmissionTriples) {
      const submissionUri = triple.subject.value;
      try {
        const submission = await createSubmissionFromSubmission(submissionUri);
        await processSubmission(submission);
      } catch (error) {
        const message = `Something went wrong while generating form data for submission ${submissionUri}`;
        console.error(`${message}\n`, error.message);
        console.error(error);
        await saveError({ message, detail: error.message });
      }
    }
  } catch (error) {
    const message =
      'Unable to process the flattening for this submission due to an unexpected problem.';
    console.error(`${message}\n`, error.message);
    console.error(error);
    await saveError({ message, detail: error.message });
  }
});

app.put('/submission-documents/:uuid/flatten', async function (req, res) {
  let submission;
  try {
    submission = await createSubmissionFromSubmissionResource(req.params.uuid);
    if (submission) await processSubmission(submission);

    return res.status(204).send();
  } catch (e) {
    console.log('Something went wrong while flattening the submission.');
    console.log(`Exception: ${e.stack}`);
    return res.status(500).send();
  }
});

async function processSubmission(submission) {
  const form = new FormData({ submission });
  await form.flatten();
}
