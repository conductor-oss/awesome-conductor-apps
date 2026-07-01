package main

import (
	"fmt"
	"time"

	"github.com/conductor-sdk/conductor-go/sdk/client"
	"github.com/conductor-sdk/conductor-go/sdk/model"
	"github.com/conductor-sdk/conductor-go/sdk/settings"

	"github.com/conductor-sdk/conductor-go/sdk/worker"
)

// Replace with your own credentials
const API_URL = "https://your-cluster.orkesconductor.io/api"
const KEY_ID = "_CHANGE_ME_"
const SECRET = "_CHANGE_ME_"

const TASK_NAME = "myTask"

func myTask(task *model.Task) (any, error) {
	return map[string]interface{}{
		"greeting": "Hello, " + fmt.Sprintf("%v", task.InputData["name"]),
	}, nil
}

var (
	apiClient = client.NewAPIClient(
		settings.NewAuthenticationSettings(KEY_ID, SECRET),
		settings.NewHttpSettings(API_URL))
	taskRunner = worker.NewTaskRunnerWithApiClient(apiClient)
)

func main() {
	taskRunner.StartWorker(TASK_NAME, myTask, 1, time.Millisecond*200)
	fmt.Println("Press Enter to exit...")
	fmt.Scanln()
}
