# SWE Interview Agentic Workflow

This guide details the steps to set up and run the Simulated Software Engineer Interview agentic workflow using [Conductor](https://github.com/conductor-oss/conductor).

Here is a sample demo supported by Vercel (frontend) & Render (backend): [Interview Agentic Workflow](https://kg-awesome-conductor-apps.vercel.app/)

---

## Prerequisites

Before starting the workflow, you need to obtain several API keys and credentials.

### 1. Get Conductor Developer Account Key
To get the Conductor developer account key:

1. Go to [Orkes Cloud Developer](https://developer.orkescloud.com/).
2. Navigate to **Applications**: [Orkes Application Management](https://developer.orkescloud.com/applicationManagement/applications).
3. Create a new application key and secret.
4. Set the environment variables:
    ```shell
    export CONDUCTOR_SERVER_URL=https://developer.orkescloud.com/api
    export CONDUCTOR_AUTH_KEY=<YOUR_CONDUCTOR_AUTH_KEY>
    export CONDUCTOR_AUTH_SECRET=<YOUR_CONDUCTOR_AUTH_SECRET>
    ```

---

### 2. Get OpenAI API Key
To get your OpenAI API key:

1. Log in to [OpenAI API Keys](https://platform.openai.com/api-keys).
2. Generate a new API key following the provided instructions.
3. Set the environment variable:
    ```shell
    export OPENAI_API_KEY=<YOUR_OPENAI_KEY>
    ```

---

### 3. Get Google Authentication Credentials
To set up Google authentication, you can either set up a service account (works on both local & prod) or configure a standard google api (local only):

**Local & Prod:**
1. Follow the [Google API Quickstart Tutorial](https://cloud.google.com/iam/docs/service-accounts-create#iam-service-accounts-create-console).
2. Click Manage Keys and create a key and download the resulting `project-name.json`
3. JSON stringify the contents of `project-name.json` using one of the following methods:

   - **Python library**  
     Run this command in your terminal:
     ```shell
     python3 -c 'import json; print(json.dumps(json.load(open("/[PATH_TO_REPO]/project-name.json"))))'
     ```

   - **Online tool**  
     Use [JSON Stringify Online](https://jsonformatter.org/json-stringify-online)

4. Set the environment variables:
    ```shell
    export GOOGLE_SERVICE_ACCOUNT_JSON=<PASTE_GOOGLE_SERVICE_ACCOUNT_JSON_STRING_HERE>
    export ENV=prod
    ```

**Local only**
1. Follow the [Google API Quickstart Tutorial](https://developers.google.com/drive/api/quickstart/python).
2. Set up your environment and a Google Cloud project.
3. Configure the OAuth consent screen.
4. Move the downloaded `credentials.json` file to your workflow directory.
5. On the first run, the server will prompt you to log in with your Google credentials, generating the `token.json` file.
6. Set the environment variable:
    ```shell
    export ENV=dev
    ```

---

### 4. Get SendGrid API Key
To get your SendGrid API key and update sender's email address:

1. Log in to [SendGrid Email API](https://sendgrid.com/en-us/solutions/email-api).
2. Follow the instructions to generate a Twilio SendGrid API key.
3. Set the environment variable:
    ```shell
    export SEND_GRID_API_KEY=<YOUR_SEND_GRID_API_KEY>
    ```
4. Use your associated SendGrid email address to update the sender email addresses used in the workflow:
    - `resources/interviewAgenticWorkflow.json`:  Line 878, from email address value
    - `resources/interviewAgenticWorkflow.json`:  Line 996, from email address value
5. Set the environment variable:
    ```shell
    export SEND_GRID_EMAIL_ADDRESS=<YOUR_SEND_GRID_EMAIL_ADDRESS>
    ```

---

## Running the Servers

### Backend Server & Workflow
To run the backend server and workflow:

1. Set the Python path:
    ```shell
    cd awesome-conductor-apps/python/interview_agentic_app
    export PYTHONPATH=$(pwd)
    ```
2. Create a python virtual env
    ```shell
    python3 -m venv venv
    source venv/bin/activate
    ```
3. Install required packages:
    ```shell
    pip3 install -r requirements.txt
    ```
4. Run the backend server:
    ```shell
    cd workflow
    python app.py
    ```

### Frontend Server
To run the frontend server:

1. Navigate to the frontend directory:
    ```shell
    cd interview-chat
    ```
2. Install dependencies:
    ```shell
    npm install --legacy-peer-deps
    ```
3. Start the frontend server:
    ```shell
    npm run dev
    ```

---

## Source Code

Here are the key components of the project:

- **Backend Server with API Endpoints**: [workflow/app.py](workflow/app.py)
- **Main Method (Triggers Workflow Agent)**: [workflow/workflow.py](workflow/workflow.py)
- **Tools (Service Worker for Agent Tools)**: [worker/workers.py](worker/workers.py)
- **Frontend Application Entry Point**: [interview-chat/pages/index.js](interview-chat/pages/index.js)