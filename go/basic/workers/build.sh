#!/bin/bash

# Download dependencies
cd ..
go mod download
go mod tidy

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "CONDUCTOR_SERVER_URL=" > .env.local
    echo "CONDUCTOR_API_KEY_ID=" >> .env.local
    echo "CONDUCTOR_API_KEY_SECRET=" >> .env.local
    echo "Created .env.local file. Please fill in your Conductor API credentials."
fi

# Make the script executable
chmod +x app/main.go

echo "Build completed. Make sure to:"
echo "1. Fill in your Conductor API credentials in .env.local"
echo "2. Run 'source .env.local' to load the environment variables"
echo "3. Start the application with 'go run app/main.go'" 