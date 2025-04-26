# Fraud detection management workflow

This workflow automates and governs the process of detecting and handling potentially fraudulent transactions using AI, with built-in human oversight and feedback loops.

It’s evaluates transactions for risk using an LLM (large language model) and then routes them differently depending on the assessed risk level — either automatically approving low-risk transactions or sending high-risk ones for human review and decision.

## Prerequisites

- An account on Orkes Conductor's [Developer Playground](https://developer.orkescloud.com/)
- An OpenAI API key

## Setup Process

### 1. Import Workflow Definitions

The following workflows are available in this GitHub repository:
- generate_transaction_workflow
- execute_Rules
- payment_flow

Repeat for each workflow:
1. Log into Orkes Conductor [Developer Edition](https://developer.orkescloud.com/), go to **Definitions** > **Workflow** in the left navigation panel.
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
3. Switch to the **Code** tab and paste the JSON for the riskScore prompt.
4. Switch to the **Form** tab and edit the **Model(s)** parameter based on the models you added in the previous step.
5. Select **Save** > **Confirm save**.


### 4. Run the Workflow
 
 Run it directly with the baked-in inputs.

1. Go back to **Definitions** > **Workflow**.
2. Select the execute_Rules workflow.
3. Switch to the **Run** tab in the right panel
4. Select **Run Workflow**.

As each task completes, you can review its output in real-time. Afterwards, you can experiment with your own inputs.


## Troubleshooting

If you encounter any issues:
- Ensure all workflow definitions are correctly imported.
- Verify your OpenAI API key is valid and has sufficient credits.
- Check that the AI prompt and main agentic workflow are properly configured with the right models.
- Please contact us if you need more help.

## Additional Resources

- [Orkes Conductor Documentation](https://orkes.io/content/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)