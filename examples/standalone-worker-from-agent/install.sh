#!/bin/bash

echo -e "\033[96mInstalling Orkes Conductor Workflow Template\033[0m"

echo ""

read -p "Enter the folder name (default: worker-task-example): " FOLDER_NAME
FOLDER_NAME=${FOLDER_NAME:-worker-task-example}

echo -e "\033[37mSelect your preferred SDK language:\033[0m"

echo ""

echo -e "\033[37mUsing SDK: $SDK\033[0m"

echo ""

# create the folder
mkdir -p $FOLDER_NAME

# cd into the folder
cd $FOLDER_NAME

# Download the repo zip
curl -fsSL https://github.com/conductor-oss/awesome-conductor-apps/archive/refs/heads/CDX-241-add-basic-templates.zip -o awesome-conductor-apps.zip

echo ""

# Unzip the repo
unzip awesome-conductor-apps.zip

echo ""

# copy the template folder 
cp -r awesome-conductor-apps-CDX-241-add-basic-templates/$SDK/worker-task-example/* .

rm -rf awesome-conductor-apps.zip

# remove the repo
rm -rf awesome-conductor-apps-CDX-241-add-basic-templates

cd workers

echo -e "\033[37mPaste your worker code here:\033[0m"

echo ""

read -p "Enter your worker code: " WORKER_CODE

echo $WORKER_CODE > main.py

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
