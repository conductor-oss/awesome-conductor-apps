package main

import (
	"fmt"
	"log"

	"github.com/conductor-sdk/conductor-go/sdk/client"
	"github.com/conductor-sdk/conductor-go/sdk/model"
	"github.com/conductor-sdk/conductor-go/sdk/settings"
	"github.com/conductor-sdk/conductor-go/sdk/workflow"
	"github.com/conductor-sdk/conductor-go/sdk/workflow/executor"
)

// Set up an application in your Orkes Conductor cluster. Sign up for a Developer Edition account at https://developer.orkescloud.com.
// - Use the application's Key ID and Secret here.
// - Set your cluster's API URL as the SERVER_URL (e.g., "https://developer.orkescloud.com/api" for Developer Edition).
const SERVER_URL = "_CHANGE_ME_"
const KEY_ID = "_CHANGE_ME_"
const SECRET = "_CHANGE_ME_"

var (
	apiClient = client.NewAPIClient(
		settings.NewAuthenticationSettings(KEY_ID, SECRET),
		settings.NewHttpSettings(SERVER_URL))
	// A WorkflowExecutor instance is used to register and execute workflows.
	workflowExecutor = executor.NewWorkflowExecutor(apiClient)
)

func main() {
	// Create the workflow definition.
	wf := workflow.NewConductorWorkflow(workflowExecutor).
		Name("helloWorld").
		Version(1).
		Description("Hello World workflow that greets a user. Uses a Switch task, HTTP task, and Simple task.")

	httpTask := workflow.NewHttpTask("get-user_ref", &workflow.HttpInput{Uri: "https://randomuser.me/api/"})
	switchTask := workflow.NewSwitchTask("user-criteria_ref", "${get-user_ref.output.response.body.results[0].location.country}").
		SwitchCase("United States", workflow.NewSimpleTask("myTask", "myTask_ref").Input("name", "${get-user_ref.output.response.body.results[0].name.first}"))

	wf.Add(httpTask)
	wf.Add(switchTask)

	// Register the workflow with overwrite = true.
	err := wf.Register(true)
	if err != nil {
		log.Fatalf("Failed to register workflow: %v", err)
	}
	fmt.Printf("Registered workflow: %s\n", wf.GetName())

	// Start the workflow.
	id, err := workflowExecutor.StartWorkflow(&model.StartWorkflowRequest{
		Name:    wf.GetName(),
		Version: wf.GetVersion(),
	})

	if err != nil {
		log.Fatalf("Error when starting workflow: %v", err)
	}
	fmt.Printf("Started workflow: %s\n", id)
}
