import {
  orkesConductorClient,
  WorkflowExecutor,
  httpTask,
  simpleTask,
  switchTask,
} from "@io-orkes/conductor-javascript";

// Set up an application in your Orkes Conductor cluster. Sign up for a Developer Edition account at https://developer.orkescloud.com. 
// - Set your cluster's API URL as the serverUrl (e.g., "https://developer.orkescloud.com/api" for Developer Edition).
// - Use the application's Key ID and Secret here.
const config = {
  serverUrl: "_CHANGE_ME_",
  keyId: "_CHANGE_ME_",
  keySecret: "_CHANGE_ME_",
};

const client = await orkesConductorClient(config);
// A WorkflowExecutor instance is used to register and execute workflows.
const executor = new WorkflowExecutor(client);

// Create the workflow definition.
const wf = {
  name: "helloWorld",
  version: 1,
  description:
    "Hello World workflow that greets a user. Uses a Switch task, HTTP task, and Simple task.",
  tasks: [
    httpTask("get-user_ref", { uri: "https://randomuser.me/api/" }),
    switchTask(
      "user-criteria_ref",
      "${get-user_ref.output.response.body.results[0].location.country}",
      {
        "United States": [
          simpleTask("myTask_ref", "myTask", {
            name: "${get-user_ref.output.response.body.results[0].name.first}",
          }),
        ],
      }
    ),
  ],
};

// Register the workflow with overwrite = true.
await executor.registerWorkflow(true, wf);

// Start the workflow.
const id = await executor.startWorkflow({name: wf.name, version: wf.version});
console.log(`Started workflow: ${id}`);
client.stop()
