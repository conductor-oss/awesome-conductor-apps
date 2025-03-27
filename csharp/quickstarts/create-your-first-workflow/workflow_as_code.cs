using Conductor.Client.Authentication;
using Conductor.Client.Models;
using Conductor.Client;
using Conductor.Definition;
using Conductor.Executor;
using Conductor.Definition.TaskType;

// Set up an application in your Orkes Conductor cluster. Sign up for a Developer Edition account at https://developer.orkescloud.com. 
// - Set your cluster's API URL as the BasePath (e.g., "https://developer.orkescloud.com/api" for Developer Edition).
// - Use the application's Key ID and Secret here.
var conf = new Configuration
{
    BasePath = "https://developer.orkescloud.com/api",
    AuthenticationSettings = new OrkesAuthenticationSettings("_CHANGE_ME_", "_CHANGE_ME_")
};

// A WorkflowExecutor instance is used to register and execute workflows.
var executor = new WorkflowExecutor(conf);

// Create the workflow definition.
var workflow = new ConductorWorkflow()
        .WithName("helloWorld")
        .WithDescription("Hello World workflow that greets a user. Uses a Switch task, HTTP task, and Simple task.")
        .WithVersion(1)
        .WithTask(new HttpTask("get-user_ref", new HttpTaskSettings { uri = "https://randomuser.me/api/" }))
        .WithTask(new SwitchTask("user-criteria_ref", "${get-user_ref.output.response.body.results[0].location.country}")
            .WithDecisionCase("United States",
                [new SimpleTask("myTask", "myTask_ref").WithInput("name", "${get-user_ref.output.response.body.results[0].name.first}")]));

// Register the workflow with overwrite = true.
executor.RegisterWorkflow(
    workflow: workflow,
    overwrite: true
);

// Start the workflow.
var workflowId = executor.StartWorkflow(new StartWorkflowRequest(name: workflow.Name, version: workflow.Version));
Console.WriteLine($"Started Workflow: {workflowId}");
