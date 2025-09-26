#!/bin/bash

if [ "$1" == "-i" ]; then
  read -s -p "Enter your Conductor Auth Key: " CONDUCTOR_AUTH_KEY
  echo ""
  read -s -p "Enter your Conductor Auth Secret: " CONDUCTOR_AUTH_SECRET
  echo ""
  read -p "Enter your Conductor Server Url: " CONDUCTOR_SERVER_URL
  echo ""
fi

# Let the user choose an SDK version from a list
echo "Choose an SDK version:"
echo "1. Node.js"
echo "2. Python"
echo "3. Java"
echo "4. Go"
echo "5. C#"

read -p "Enter the number of the SDK version you want to use: " SDK_VERSION

case $SDK_VERSION in
  1)
    SDK="node"
    ;;
  2)
    SDK="python"
    ;;
  3)
    SDK="java"
    ;;
  4)
    SDK="go"
    ;;
  5)
    SDK="csharp"
    ;;
  *)
    echo "Invalid SDK version"
    exit 1
    ;;
esac

echo "Using SDK: $SDK"

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Override with command-line arguments if provided and not empty
if [ ! -z "$1" ]; then
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
