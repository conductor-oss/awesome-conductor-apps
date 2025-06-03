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



"Authorization": "Bearer &lt;PLACEHOLDER_API_KEY>"


## Workflow Steps

### Step 1: `check_endpoint`

* **Type:** HTTP
* **Description:** Sends a GET request to the specified URL (passed as input)
* **Purpose:** Verifies that the target endpoint is reachable and returns a valid HTTP response



### Step 2: `check_status`

* **Type:** SWITCH
* **Description:** Evaluates the response status from Step 1
* **Purpose:** Routes the flow based on success or failure of the endpoint check



### Step 3a: `send_failure_alert`

* **Type:** HTTP
* **Description:** Sends an alert email via SendGrid if the endpoint is invalid
* **Purpose:** Automatically notifies users of failure for troubleshooting



### Step 3b: `set_success_flag`

* **Type:** SET\_VARIABLE
* **Description:** Sets a boolean variable, `status_code`, to `true`
* **Purpose:** Indicates that the endpoint is healthy for use in downstream tasks



### Step 4: `terminate_workflow`

* **Type:** TERMINATE
* **Description:** Stops the workflow after failure
* **Purpose:** Halts further steps if the check fails




