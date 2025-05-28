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

Replace with your generated API Key


## Workflow Steps 


<table>
  <tr>
   <td>Step
   </td>
   <td>Task Name
   </td>
   <td>Task Type
   </td>
   <td>Description 
   </td>
   <td>Purpose
   </td>
  </tr>
  <tr>
   <td>1
   </td>
   <td>check_endpoint
   </td>
   <td>HTTP
   </td>
   <td>Sends a GET request to the specified URL (passed as input)
   </td>
   <td>Verifies that the target endpoint is reachable and returns a valid HTTP response
   </td>
  </tr>
  <tr>
   <td>2
   </td>
   <td>check_status
   </td>
   <td>SWITCH
   </td>
   <td>Evaluates the response status from Step 1
   </td>
   <td>Routes the flow based on success or failure of the endpoint check
   </td>
  </tr>
  <tr>
   <td>3a
   </td>
   <td>send_failure_alert
   </td>
   <td>HTTP
   </td>
   <td>Sends an alert email via SendGrid if the endpoint is invalid (sender and recipient email passed in as inputs)
   </td>
   <td>Automatically notifies users of failure for troubleshooting.
   </td>
  </tr>
  <tr>
   <td>3b
   </td>
   <td>set_success_flag
   </td>
   <td>SET_VARIABLE
   </td>
   <td>Sets a boolean variable, status_code, to true
   </td>
   <td>Indicates that the endpoint is healthy for use in downstream tasks
   </td>
  </tr>
  <tr>
   <td>4
   </td>
   <td>terminate_workflow
   </td>
   <td>TERMINATE
   </td>
   <td>Stops the workflow after failure
   </td>
   <td>Halts further steps if the check fails
   </td>
  </tr>
</table>


