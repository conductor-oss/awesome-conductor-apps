#!/bin/bash

echo -e "\033[96mInstalling Orkes Conductor Workflow Template\033[0m"

echo ""

read -p "Enter the folder name (default: worker-task-example): " FOLDER_NAME
FOLDER_NAME=${FOLDER_NAME:-worker-task-example}

echo ""

# create the folder
mkdir -p $FOLDER_NAME

# cd into the folder
cd $FOLDER_NAME

# Download the repo zip
curl -fsSL https://github.com/conductor-oss/awesome-conductor-apps/archive/refs/heads/CDX-241-add-basic-templates.zip -o awesome-conductor-apps.zip

echo ""

# Unzip the repo quietly
unzip -qq awesome-conductor-apps.zip

echo ""

# copy the template folder 
cp -r awesome-conductor-apps-CDX-241-add-basic-templates/python/standalone-worker-from-agent/* .

rm -rf awesome-conductor-apps.zip

# remove the repo
rm -rf awesome-conductor-apps-CDX-241-add-basic-templates

cd workers

echo -e "\033[37mPaste your worker code into the main.py file and save it.\033[0m"

echo ""

# Echo the full path to the main.py file
echo "main.py file is located at: $(pwd)/main.py"

echo ""

# Wait for any key
read -n 1 -s -r -p "Press any key to continue"

# Build the workers
./build.sh

echo ""
echo -e "\033[90m--------------------------------\033[0m"
echo ""

echo -e "\033[92mSuccessfully built workers ✓\033[0m"

echo ""

echo -e "\033[96mGo back to the Orkes Conductor UI to obtain your API credentials.\033[0m"

echo ""

./run.sh -i
