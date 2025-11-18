#!/bin/bash

# Determine if we need python or python3
if command -v python3 &> /dev/null; then
    PYTHON=python3
else
    PYTHON=python
fi

# Activate virtual environment if it exists
if [ -d "../venv" ]; then
    source ../venv/bin/activate
else
    echo "Warning: Virtual environment not found. Run build.sh first."
    exit 1
fi

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

$PYTHON main.py
