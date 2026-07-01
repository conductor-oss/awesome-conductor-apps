import {
  OrkesClients,
  WorkflowExecutor,
  httpTask,
  simpleTask,
  switchTask,
} from "@io-orkes/conductor-javascript";

const clients = await OrkesClients.from();
const executor = new WorkflowExecutor(clients.getClient());

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

await executor.registerWorkflow(true, wf);

const id = await executor.startWorkflow({ name: wf.name, version: wf.version });
console.log(`Started workflow: ${id}`);
