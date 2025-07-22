package main

import (
	"os"
	"os/signal"
	"syscall"

	"basic/workers"

	"github.com/conductor-sdk/conductor-go/sdk/client"
)

func main() {
	apiClient := client.NewAPIClientFromEnv()

	// Start the workers
	workers.RegisterAndStartWorkers(apiClient)

	// Wait for termination signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan
}
