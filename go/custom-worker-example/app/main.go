package main

import (
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"

	"basic/workers"

	"github.com/conductor-sdk/conductor-go/sdk/client"
	"github.com/joho/godotenv"
)

func main() {
	// Get the directory where main.go is located
	_, filename, _, _ := runtime.Caller(0)
	currentDir := filepath.Dir(filename)
	// Load environment variables from .env.local in the parent directory
	envPath := filepath.Join(filepath.Dir(currentDir), ".env.local")

	if err := godotenv.Load(envPath); err != nil {
		// Continue even if .env.local is not found
	}

	apiClient := client.NewAPIClientFromEnv()

	// Start the workers
	workers.RegisterAndStartWorkers(apiClient)

	// Wait for termination signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan
}
