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
    read -p "Orkes API Key ID: " ORKES_API_KEY_ID
    read -p "Orkes API Key Secret: " ORKES_API_KEY_SECRET
    read -p "Orkes API URL: " ORKES_API_URL

    # Validate inputs are not empty
    if [ -z "$ORKES_API_KEY_ID" ] || [ -z "$ORKES_API_KEY_SECRET" ] || [ -z "$ORKES_API_URL" ]; then
        print_status "$RED" "Error: All credentials are required"
        exit 1
    fi
}

# Main installation logic
main() {
    print_status "$GREEN" "Starting Conductor Workers installation..."

    # Check for Docker first
    if command_exists docker; then
        print_status "$GREEN" "Docker detected - proceeding with Docker installation"
        
        # Get Orkes credentials
        get_orkes_credentials

        # Clone or update repository
        if [ -d "awesome-conductor-apps" ]; then
            print_status "$YELLOW" "Repository already exists. Checking for local changes..."
            cd awesome-conductor-apps
            if [ -n "$(git status --porcelain)" ]; then
                print_status "$RED" "You have uncommitted changes in awesome-conductor-apps. Please stash or commit them before proceeding."
                exit 1
            else
                print_status "$GREEN" "No local changes detected. Ensuring correct remote and branch, then pulling latest changes from main..."
                git remote set-url origin https://github.com/conductor-oss/awesome-conductor-apps.git
                git checkout main
                git pull origin main
            fi
            cd typescript/claims-workflow/workers
        else
            print_status "$GREEN" "Cloning repository..."
            git clone https://github.com/conductor-oss/awesome-conductor-apps.git
            cd awesome-conductor-apps/typescript/claims-workflow/workers
        fi

        # Build Docker image
        print_status "$GREEN" "Building Docker image..."
        docker build -t conductor-workers .

        # Run using Docker
        print_status "$GREEN" "Running Conductor Workers using Docker..."
        docker run conductor-workers "$ORKES_API_KEY_ID" "$ORKES_API_KEY_SECRET" "$ORKES_API_URL"

    # Check for Node.js as fallback
    elif command_exists node; then
        print_status "$YELLOW" "Docker not found, but Node.js detected - proceeding with Node.js installation"
        
        # Check Node.js version
        NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_status "$RED" "Error: Node.js version 18 or higher is required"
            exit 1
        fi

        # Get Orkes credentials
        get_orkes_credentials

        # Clone or update repository
        if [ -d "awesome-conductor-apps" ]; then
            print_status "$YELLOW" "Repository already exists. Checking for local changes..."
            cd awesome-conductor-apps
            if [ -n "$(git status --porcelain)" ]; then
                print_status "$RED" "You have uncommitted changes in awesome-conductor-apps. Please stash or commit them before proceeding."
                exit 1
            else
                print_status "$GREEN" "No local changes detected. Ensuring correct remote and branch, then pulling latest changes from main..."
                git remote set-url origin https://github.com/conductor-oss/awesome-conductor-apps.git
                git checkout main
                git pull origin main
            fi
            cd typescript/claims-workflow/workers
        else
            print_status "$GREEN" "Cloning repository..."
            git clone https://github.com/conductor-oss/awesome-conductor-apps.git
            cd awesome-conductor-apps/typescript/claims-workflow/workers
        fi

        # Make run.sh executable and run it with credentials
        print_status "$GREEN" "Starting Conductor workers..."
        chmod +x run.sh
        ./run.sh "$ORKES_API_KEY_ID" "$ORKES_API_KEY_SECRET" "$ORKES_API_URL"

    else
        print_status "$RED" "Error: Neither Docker nor Node.js (v18+) found. Please install either Docker or Node.js v18+ to continue."
        exit 1
    fi
}

# Execute main function
main 