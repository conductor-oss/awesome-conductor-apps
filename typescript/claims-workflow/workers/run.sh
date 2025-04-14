#!/bin/bash

# Default values
ORKES_API_KEY_ID=${1:-""}
ORKES_API_KEY_SECRET=${2:-""}
ORKES_API_URL=${3:-""}

# Export the environment variables
export ORKES_API_KEY_ID
export ORKES_API_KEY_SECRET
export ORKES_API_URL

# Check if required Node modules are installed and build if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    yarn install
    echo "Building TypeScript..."
    yarn build
fi

# Run the workers
echo "Starting Conductor workers..."
node dist/index.js 