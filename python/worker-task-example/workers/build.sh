#!/bin/bash

# Determine if we need python or python3
if command -v python3 &> /dev/null; then
    PYTHON=python3
else
    PYTHON=python
fi

# Determine if we need pip or pip3
if command -v pip3 &> /dev/null; then
    PIP=pip3
else
    PIP=pip
fi

# Create virtual environment if it doesn't exist
if [ ! -d "../venv" ]; then
    $PYTHON -m venv ../venv
fi

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
$PIP install -r requirements.txt

# Make the script executable
chmod +x main.py

echo "Build completed."
