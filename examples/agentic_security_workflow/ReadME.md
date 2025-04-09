# Agentic Security Workflow Setup Guide

This guide will help you set up and run the Agentic Security Workflow in Orkes Conductor.

## Prerequisites

- An account on Orkes Conductor's [Developer Playground](https://developer.orkescloud.com/)
- An OpenAI API key

## Setup Process

### 1. Import Workflow Definitions

The following workflows are available in this GitHub repository:
- Agentic_Security_Example
- Notify-Channels-x-mocked
- security_get_device_id
- vision_one_deep_visibility_hunt
- vision_one_device_scan

For each workflow:
1. In [Developer Playground](https://developer.orkescloud.com/), go to **Definitions** > **Workflow** in the left navigation panel.
2. Select **+ Create workflow** in the top right.
3. Select the **Code** tab in the right panel and paste the JSON workflow definition from GitHub.
4. Select **Save** > **Confirm**.


### 2. Configure OpenAI Integration

1. Go to **Integrations** in the left navigation panel.
2. Select **+ New Integration** in the top right.
3. Locate the OpenAI card and select **+ Add**.
4. Set the following values:
    * Integration name—*openai*
    * API Key—*<your_OpenAI_API_key>*
    * Description—*OpenAI integration*
5. Return to the **Integrations** screen and locate your newly-added OpenAI integration.
6. Under the **Actions** column, select the Add/Edit models icon.
7. Select **+ New Model** and add the following models:
    * `gpt-4o` (required)
    * `gpt-4o-mini` (recommended)
    * Any other [OpenAI models](https://platform.openai.com/docs/models) you wish to use

Repeat this procedure for other providers and models you want to use and compare.


### 3. Add AI Prompt

The repository contains the ​`llm_alert_analysis` prompt which analyzes the detected alerts to form an attack narrative:`

1. Go to **AI Prompts** in the left navigation panel.
2. Select **+ Add AI prompt** in the top right.
3. Switch to the **Code** tab and paste the JSON for the llm_alert_analysis prompt.
4. Switch to the **Form** tab and edit the **Model(s)** parameter based on the models you added in the previous step.
5. Select **Save** > **Confirm save**.


### 4. Run the Workflow
 
1. Go back to **Definitions** > **Workflow**.
2. Select the Agentic_Security_Example workflow.
3. Switch to the **Run** tab in the right panel
4. Select **Run Workflow**.

As each task completes, you can review its output in real-time. Try the provided example inputs, then experiment with your own inputs

## Troubleshooting

If you encounter any issues:
- Ensure all workflow definitions are correctly imported.
- Verify your OpenAI API key is valid and has sufficient credits.
- Check that the AI prompt and main agentic workflow are properly configured with the right models.
- Please contact us if you need more help.

## Additional Resources

- [Orkes Conductor Documentation](https://orkes.io/content/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)