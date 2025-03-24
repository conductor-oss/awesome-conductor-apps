# Agentic Security Workflow Setup Guide

This guide will help you set up and run the Agentic Security Workflow in Orkes Conductor.

## Prerequisites

- An account on [Orkes Conductor Developer Console](https://developer.orkescloud.com/)
- Access to the GitHub repository containing the workflow definitions
- An OpenAI API key

## Setup Process

### 1. Import Workflow Definitions

Ensure all of the following workflows are available from the GitHub repository:
- Agentic_Security_Example
- Notify-Channels-x-mocked
- security_get_device_id
- vision_one_deep_visibility_hunt
- vision_one_device_scan

For each workflow:

1. Log in to your Orkes Conductor account
2. Navigate to **Definitions → Workflow** in the left navigation panel
3. Click on the **Code** tab in the right panel
4. Paste the JSON definition for the workflow
5. Click **Save** and confirm

### 2. Configure OpenAI Integration

1. In the left navigation panel, select **Integrations**
2. Click **+New Integration** in the top right
3. Find the OpenAI card and click **+Add**
4. Set the following values:
   - Integration Name: `openai`
   - API Key: *Paste your OpenAI API key*
   - Add a description (optional)
5. After returning to the integrations screen, find your new OpenAI integration
6. Click the **0** in the models column
7. Click **+New Model**
8. Configure the following models:
   - `gpt-4o` (required)
   - `gpt-4o-mini` (recommended)
   - Any other models you wish to use
9. Repeat this for other providers and models you want to compare.

### 3. Add AI Prompt

1. Navigate to **AI Prompts** in the left navigation panel
2. Click **+Add AI Prompt** in the top right
3. Switch to the **Code** tab
4. Paste the JSON for the `llm_alert_analysis` prompt
5. Click **Save** and confirm

### 4. Run the Workflow

1. Navigate back to **Definitions → Workflow**
2. Click on the **Agentic_Security_Example** workflow
3. Switch to the **Run** tab in the right panel
4. Click **Run Workflow**
5. As each task completes, you can review its output in real-time
6. Try the provided example inputs, then experiment with your own inputs

## Troubleshooting

If you encounter any issues:
- Ensure all workflow definitions are correctly imported
- Verify your OpenAI API key is valid and has sufficient credits
- Check that the AI prompt is properly configured
- Please contact us if you need more help.

## Additional Resources

- [Orkes Conductor Documentation](https://orkes.io/content/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)