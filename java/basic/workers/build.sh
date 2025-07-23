#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Navigate to project root (parent directory of the script's location)
cd "${SCRIPT_DIR}/.."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "ORKES_API_URL=" > .env.local
    echo "ORKES_API_KEY_ID=" >> .env.local
    echo "ORKES_API_KEY_SECRET=" >> .env.local
    echo "Created .env.local file. Please fill in your Orkes API credentials."
fi

gradle wrapper

# Build the project
./gradlew clean build

echo "Build completed. Make sure to:"
echo "1. Fill in your Orkes API credentials in .env.local"
echo "2. Run the worker with: './gradlew run'"
