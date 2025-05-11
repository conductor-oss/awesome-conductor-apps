#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for Orkes credentials
get_orkes_credentials() {
    echo "Please enter your Orkes credentials:"
    read -p "Orkes API Key: " CONDUCTOR_AUTH_KEY
    read -p "Orkes API Secret: " CONDUCTOR_AUTH_SECRET
    read -p "Orkes API URL: " CONDUCTOR_SERVER_URL

    # Validate inputs are not empty
    if [ -z "$CONDUCTOR_AUTH_KEY" ] || [ -z "$CONDUCTOR_AUTH_SECRET" ] || [ -z "$CONDUCTOR_SERVER_URL" ]; then
        print_status "$RED" "Error: All credentials are required"
        exit 1
    fi
}

# Main installation logic
main() {
    print_status "$GREEN" "Starting Agentic Research PDF Worker installation..."

    # Check for Docker first
    if command_exists docker; then
        print_status "$GREEN" "Docker detected - proceeding with Docker installation"
        
        # Get Orkes credentials
        get_orkes_credentials

        # Clone repository
        print_status "$GREEN" "Cloning repository..."
        git clone https://github.com/conductor-oss/awesome-conductor-apps
        cd awesome-conductor-apps/python/agentic_research/workers

        # Build Docker image
        print_status "$GREEN" "Building Docker image..."
        docker build -t agentic-pdf-worker .

        # Run using Docker
        print_status "$GREEN" "Running Agentic PDF Worker using Docker..."
        docker run --rm \
            -v "$(pwd)":/app \
            -e CONDUCTOR_AUTH_KEY="$CONDUCTOR_AUTH_KEY" \
            -e CONDUCTOR_AUTH_SECRET="$CONDUCTOR_AUTH_SECRET" \
            -e CONDUCTOR_SERVER_URL="$CONDUCTOR_SERVER_URL" \
            agentic-pdf-worker

    # Check for Python as fallback
    elif command_exists python3; then
        print_status "$YELLOW" "Docker not found, but Python detected - proceeding with local Python installation"

        # Get Orkes credentials
        get_orkes_credentials

        # Clone repository
        print_status "$GREEN" "Cloning repository..."
        git clone https://github.com/conductor-oss/awesome-conductor-apps
        cd awesome-conductor-apps/python/agentic_research/workers

        # Make run.sh executable and run it with credentials
        print_status "$GREEN" "Starting Agentic PDF Worker..."
        chmod +x run.sh
        ./run.sh "$CONDUCTOR_AUTH_KEY" "$CONDUCTOR_AUTH_SECRET" "$CONDUCTOR_SERVER_URL"

    else
        print_status "$RED" "Error: Neither Docker nor Python 3 found. Please install either Docker or Python 3 to continue."
        exit 1
    fi
}

# Execute main function
main
