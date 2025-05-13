#!/bin/bash

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Override with command-line arguments if provided and not empty
if [ ! -z "$1" ]; then
  ORKES_API_KEY_ID=$1
fi

if [ ! -z "$2" ]; then
  ORKES_API_KEY_SECRET=$2
fi

if [ ! -z "$3" ]; then
  ORKES_API_URL=$3
fi

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
