#!/bin/bash

# Check if .NET SDK is installed
if ! command -v dotnet &> /dev/null; then
    echo ".NET SDK is not installed. Please install it from https://dotnet.microsoft.com/download"
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f "../.env.local" ]; then
    echo "ORKES_API_URL=https://developer.orkescloud.com/api" > ../.env.local
    echo "ORKES_API_KEY_ID=" >> ../.env.local
    echo "ORKES_API_KEY_SECRET=" >> ../.env.local
    echo "Created .env.local file. Please fill in your Orkes API credentials."
fi

# Restore dependencies
dotnet restore ../basic.csproj

# Build the project
dotnet build ../basic.csproj

# Make the script executable
chmod +x build.sh

echo "Build completed. Make sure to:"
echo "1. Fill in your Orkes API credentials in .env.local"
echo "2. Run the worker with 'dotnet run --project ../basic.csproj'" 