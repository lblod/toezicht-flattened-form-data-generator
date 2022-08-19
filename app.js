import { NamedNode, triple } from 'rdflib';
import bodyParser from 'body-parser';
import { app } from 'mu';
import {
  createSubmissionFromSubmissionResource,
  createSubmissionFromSubmissionTask,
} from './lib/submission';
import { FormData } from './lib/form-data';
import { TASK } from './util/namespaces';
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

app.post('/delta', async function (req, res) {
  //We can already send a 200 back. The delta-notifier does not care about the result, as long as the request is closed.
  res.status(200).send();

  try {
    const delta = new Delta(req.body);
    debugger;

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
        //TODO this service reacts to all success from the previous task. Is this correct?
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
      'The task for enriching a submission could not even be started or finished due to an unexpected problem.';
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

//async function processInsertions(delta) {
//  // TODO make it more easy to add new triggers <=> creation strategies.
//  let submissions = [];
//
//  // get submissions for submission URIs
//  let inserts = delta.getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_SENT_STATUS)));
//  for (let triple of inserts) {
//    const submission = await createSubmissionFromSubmission(triple.subject.value);
//    if (submission)
//      submissions.push(submission);
//  }
//
//  // get submissions for submission-task URIs
//  inserts = delta.getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_TASK_SUCCESSFUL)));
//  for (let triple of inserts) {
//    const submission = await createSubmissionFromSubmissionTask(triple.subject.value);
//    if (submission)
//      submissions.push(submission);
//  }
//
//  if (submissions.length) {
//    processSubmissions(submissions); // don't await async processing
//  }
//  return submissions;
//}

//async function processSubmissions(submissions) {
//  for (const submission of submissions) {
//    try {
//      await processSubmission(submission);
//    } catch (e) {
//      console.log('Something went wrong while trying to extract the form-data from the submissions');
//      console.log(`Exception: ${e.stack}`);
//    }
//  }
//}

async function processSubmission(submission) {
  const form = new FormData({ submission });
  await form.flatten();
}

//async function processDeletions(delta) {
//  let deletions = delta.getInsertsFor(triple(undefined, ADMS('status'), new NamedNode(SUBMISSION_DELETED_STATUS)));
//
//  for (let triple of deletions) {
//    try {
//      await deleteFormDataFromSubmission(triple.subject.value);
//    } catch (e) {
//      console.log('Something went wrong while trying to delete the form data');
//      console.log(`Exception: ${e.stack}`);
//    }
//  }
//
//  return deletions;
//}
