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
if [ -f ../.env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' ../.env.local | xargs)
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

export CONDUCTOR_AUTH_KEY
export CONDUCTOR_AUTH_SECRET
export CONDUCTOR_SERVER_URL

# Check if .NET SDK is installed
if ! command -v dotnet &> /dev/null; then
    echo ".NET SDK is not installed. Please install it from https://dotnet.microsoft.com/download"
    exit 1
fi

# Check if build is needed
if [ ! -d "../bin" ]; then
    echo "Building project..."
    dotnet build ../basic.csproj
fi

# Run the workers
echo "Starting Conductor Workers..."

echo ""

echo -e "\033[96mGo back to the Orkes Conductor UI to run your workflow with your custom worker.\033[0m"

echo ""

echo -e "\033[90m--------------------------------\033[0m"

dotnet run --project ../basic.csproj

