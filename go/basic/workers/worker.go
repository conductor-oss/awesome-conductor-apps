package workers

import (
	"fmt"
	"time"

	"github.com/conductor-sdk/conductor-go/sdk/client"
	"github.com/conductor-sdk/conductor-go/sdk/model"
	"github.com/conductor-sdk/conductor-go/sdk/worker"
)

const (
	batchSize    = 5
	pollInterval = 100 * time.Millisecond
)

// sayHello is a simple worker that takes a first name and last name and returns a greeting
func sayHello(task *model.Task) (interface{}, error) {
	firstName, err := GetValueFromTaskInputData(task, "firstName")
	if err != nil {
		return nil, err
	}

	lastName, err := GetValueFromTaskInputData(task, "lastName")
	if err != nil {
		return nil, err
	}

	greeting := fmt.Sprintf("Hello, %s %s", firstName.(string), lastName.(string))
	return greeting, nil
}

// GetValueFromTaskInputData helper function to get values from task input data
func GetValueFromTaskInputData(t *model.Task, key string) (interface{}, error) {
	rawValue, ok := t.InputData[key]
	if !ok {
		return "", nil
	}
	return rawValue, nil
}

// RegisterAndStartWorkers registers and starts all workers
func RegisterAndStartWorkers(apiClient *client.APIClient) {
	taskRunner := worker.NewTaskRunnerWithApiClient(apiClient)
	err := taskRunner.StartWorker("sayHello", sayHello, batchSize, pollInterval)
	if err != nil {
		fmt.Errorf("Error starting workers %s", err.Error())
	}
}
