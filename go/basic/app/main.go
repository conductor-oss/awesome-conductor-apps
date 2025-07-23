package main

import (
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"basic/workers"

	"github.com/conductor-sdk/conductor-go/sdk/client"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env.local
	envPath := filepath.Join("..", "..", ".env.local")
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
