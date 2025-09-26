#!/bin/bash

if [ "$1" == "-i" ]; then
  read -s -p "Enter your Conductor Auth Key: " CONDUCTOR_AUTH_KEY
  echo ""
  read -s -p "Enter your Conductor Auth Secret: " CONDUCTOR_AUTH_SECRET
  echo ""
  read -p "Enter your Conductor Server Url: " CONDUCTOR_SERVER_URL
  echo ""
fi

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Override with command-line arguments if provided and not empty
# and not "-i"
if [ ! -z "$1" ] && [ "$1" != "-i" ]; then
  CONDUCTOR_AUTH_KEY=$1
fi

if [ ! -z "$2" ]; then
  CONDUCTOR_AUTH_SECRET=$2
fi

if [ ! -z "$3" ]; then
  CONDUCTOR_SERVER_URL=$3
fi

# Export the environment variables
export CONDUCTOR_AUTH_KEY
export CONDUCTOR_AUTH_SECRET
export CONDUCTOR_SERVER_URL

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
