#!/bin/bash

echo -e "\033[34mInstalling Orkes Conductor Workflow Template\033[0m"

echo ""

read -p "Enter the folder name (default: basic): " FOLDER_NAME
FOLDER_NAME=${FOLDER_NAME:-basic}

echo -e "\033[37mSelect your preferred SDK language:\033[0m"

echo ""

echo "1. TypeScript"
echo "2. Python"
echo "3. Java"
echo "4. Go"
echo "5. C#"

echo ""

read -p "Enter the number of the SDK language you want to use: " SDK_LANGUAGE

case $SDK_LANGUAGE in
  1)
    SDK="typescript"
    ;;
  2)
    SDK="python"
    ;;
  3)
    SDK="java"
    ;;
  4)
    SDK="go"
    ;;
  5)
    SDK="csharp"
    ;;
esac

echo "Using SDK: $SDK"

echo ""

# create the folder
mkdir -p $FOLDER_NAME

# cd into the folder
cd $FOLDER_NAME

curl -fsSL https://raw.githubusercontent.com/conductor-oss/awesome-conductor-apps/refs/heads/CDX-241-add-basic-templates/$SDK/basic/workers/build.sh | bash

echo "Successfully built workers"

echo ""

echo "Successfully installed Orkes Conductor Workflow Template in $FOLDER_NAME"

echo ""

echo "You can now start the worker with 'cd $FOLDER_NAME && ./workers/run.sh'"
