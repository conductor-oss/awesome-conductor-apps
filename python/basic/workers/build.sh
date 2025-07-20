#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d "../venv" ]; then
    python3 -m venv ../venv
fi

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env.local if it doesn't exist
if [ ! -f "../.env.local" ]; then
    echo "ORKES_API_URL=" > ../.env.local
    echo "ORKES_API_KEY_ID=" >> ../.env.local
    echo "ORKES_API_KEY_SECRET=" >> ../.env.local
    echo "Created .env.local file. Please fill in your Orkes API credentials."
fi

# Make the script executable
chmod +x main.py

echo "Build completed. Make sure to:"
echo "1. Fill in your Orkes API credentials in .env.local"
echo "2. Run 'source ../venv/bin/activate' to activate the virtual environment"
echo "3. Start the worker with 'python main.py'"
