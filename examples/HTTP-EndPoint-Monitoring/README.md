# HTTP EndPoint Monitoring


## Overview 

This workflow checks the health of a given HTTP endpoint and sends an email alert if the endpoint is unreachable or returns an unexpected status code. This workflow is language agnostic and must be run on the Orkes website. 

## 🔧 How to Set Up Your SendGrid API Key

To use this workflow, you'll need your own **SendGrid API key**. The workflow includes a placeholder value (`"Authorization": "Bearer &lt;PLACEHOLDER_API_KEY>"`) which must be replaced with your actual key.

### 1. Generate a SendGrid API Key

1. Go to [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys).

2. Click **“Create API Key”**.

3. Name your key (e.g., `ConductorMonitorKey`).

4. Select **Full Access** or choose the specific permissions you need.

5. Click **“Create & View”** and **copy the key** immediately.

> ⚠️ You will not be able to view this key again. Store it securely.

---

### 2. Replace the Placeholder in the Workflow

Open the relevant JSON workflow file and locate the following line:

```json

"Authorization": "Bearer &lt;PLACEHOLDER_API_KEY>"

**Note:** Replace with your generated API Key wherever applicable in the workflow.


## **Workflow Steps**



* **Step 1: <code>check_endpoint</code></strong>
    * <strong>Type:</strong> HTTP
    * <strong>Description:</strong> Sends a GET request to the specified URL (passed as input)
    * <strong>Purpose:</strong> Verifies that the target endpoint is reachable and returns a valid HTTP response
* <strong>Step 2: <code>check_status</code></strong>
    * <strong>Type:</strong> SWITCH
    * <strong>Description:</strong> Evaluates the response status from Step 1
    * <strong>Purpose:</strong> Routes the flow based on success or failure of the endpoint check
* <strong>Step 3a: <code>send_failure_alert</code></strong>
    * <strong>Type:</strong> HTTP
    * <strong>Description:</strong> Sends an alert email via SendGrid if the endpoint is invalid
    * <strong>Purpose:</strong> Automatically notifies users of failure for troubleshooting
* <strong>Step 3b: <code>set_success_flag</code></strong>
    * <strong>Type:</strong> SET_VARIABLE
    * <strong>Description:</strong> Sets a boolean variable, <code>status_code</code>, to `true`
    * **Purpose:** Indicates that the endpoint is healthy for use in downstream tasks
* **Step 4: <code>terminate_workflow</code></strong>
    * <strong>Type:</strong> TERMINATE
    * <strong>Description:</strong> Stops the workflow after failure
    * <strong>Purpose:</strong> Halts further steps if the check fails
