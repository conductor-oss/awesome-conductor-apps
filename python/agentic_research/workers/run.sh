#!/bin/bash

# Usage: ./run.sh <CONDUCTOR_AUTH_KEY> <CONDUCTOR_AUTH_SECRET> <CONDUCTOR_SERVER_URL>

CONDUCTOR_AUTH_KEY=${1:-""}
CONDUCTOR_AUTH_SECRET=${2:-""}
CONDUCTOR_SERVER_URL=${3:-""}

export CONDUCTOR_AUTH_KEY
export CONDUCTOR_AUTH_SECRET
export CONDUCTOR_SERVER_URL

# Install dependencies if not already installed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment and installing dependencies..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run the worker
python save_pdf_worker.py
