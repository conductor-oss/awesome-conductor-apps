# Agentic Workflows with Conductor

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
    export CONDUCTOR_AUTH_KEY=<<YOUR_CONDUCTOR_AUTH_KEY>>
    export CONDUCTOR_AUTH_SECRET=<<YOUR_CONDUCTOR_AUTH_SECRET>>
    ```

---

### 2. Get OpenAI API Key
To get your OpenAI API key:

1. Log in to [OpenAI API Keys](https://platform.openai.com/api-keys).
2. Generate a new API key following the provided instructions.
3. Set the environment variable:
    ```shell
    export OPENAI_API_KEY=<<YOUR_OPENAI_KEY>>
    ```

---

### 3. Get Google Authentication Credentials
To set up Google authentication, you can either set up a service account (works on both local & prod) or configure a standard google api (local only):

**Local & Prod:**
1. Follow the [Google API Quickstart Tutorial](https://cloud.google.com/iam/docs/service-accounts-create#iam-service-accounts-create-console).
2. Click Manage Keys and create a key and download the resulting `project-name.json`
3. Json stringify the json contained in `project-name.json` by using this tool [JSON Stringify Online](https://jsonformatter.org/json-stringify-online)
4. Set the environment variable:
    ```shell
    export GOOGLE_SERVICE_ACCOUNT_JSON=<<YOUR_GOOGLE_SERVICE_ACCOUNT_JSON>>
    ```

**Local only**
1. Follow the [Google API Quickstart Tutorial](https://developers.google.com/drive/api/quickstart/python).
2. Set up your environment and a Google Cloud project.
3. Configure the OAuth consent screen.
4. Move the downloaded `credentials.json` file to your workflow directory.
5. On the first run, the server will prompt you to log in with your Google credentials, generating the `token.json` file.

---

### 4. Get SendGrid API Key
To get your SendGrid API key:

1. Log in to [SendGrid Email API](https://sendgrid.com/en-us/solutions/email-api).
2. Follow the instructions to generate a Twilio SendGrid API key.
3. Access your Orkes account at [Orkes Cloud Developer](https://developer.orkescloud.com/).
4. In the **Environment Variables** tab, add SendGrid credentials:
    - **Key**: `sendgrid_api_key`
    - **Value**: `[INSERT API KEY VALUE]`

---

## Running the Servers

### Backend Server & Workflow
To run the backend server and workflow:

1. Set the Python path and environment type (for Google API, set 'dev' or 'prod'):
    ```shell
    export PYTHONPATH=/[PATH_TO_REPO]/conductor-apps/python/interview_agentic_app
    export ENV=dev
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