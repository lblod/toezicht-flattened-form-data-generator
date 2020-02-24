import {app} from 'mu';
import {TurtleFile} from "./lib/turtle-file";

const TEST_FORM_PATH = "/app/util/form-example.ttl";

app.get('/', function (req, res) {
    res.send('Hello toezicht-flattened-form-data-generator');
});

app.post('/delta', async function (req, res, next) {

    // TODO find the submission doc/file URI related to the submission following the path `?submission dct:subject ?submittedDocument`

    // TODO retrieve the ttl file of the submitted submission. Make sure it is of type `<http://data.lblod.gift/concepts/form-data-file-type>`


    // const formTTL = await getFile(TEST_FORM_PATH);
    const form = await new TurtleFile().read(TEST_FORM_PATH);
    const triples = form.triples;
    debugger;

    // TODO parse this ttl file using the RDF lib.

    // TODO map the given submission to the triplets we want to save. !! BE AWARE !! Could contain multiple triples per property

    // TODO Insert a new resource of type melding:FormData with a uuid and all properties of the mapping above in the same graph as the submission

    // TODO Relate the form data resource to the submission using ?submission prov:generated ?formData

    // TODO Relate the form data resource to the form data Turtle file using ?formData prov:hadPrimarySource ?ttlFile
});