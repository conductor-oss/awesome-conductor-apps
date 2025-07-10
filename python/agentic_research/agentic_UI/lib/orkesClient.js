'use server';

import { orkesConductorClient, WorkflowExecutor } from '@io-orkes/conductor-javascript';

// Load environment variables
const { PUBLIC_NEXT_ORKES_KEY_ID, PUBLIC_NEXT_ORKES_KEY_SECRET, PUBLIC_NEXT_ORKES_SERVER_URL } = process.env;

// Validate environment variables
if (!PUBLIC_NEXT_ORKES_KEY_ID || !PUBLIC_NEXT_ORKES_KEY_SECRET || !PUBLIC_NEXT_ORKES_SERVER_URL) {
  throw new Error(
    'Missing required environment variables: PUBLIC_NEXT_ORKES_KEY_ID, PUBLIC_NEXT_ORKES_KEY_SECRET, PUBLIC_NEXT_ORKES_SERVER_URL'
  );
}

// Initialize and cache a singleton WorkflowExecutor client instance
const clientInstance = new WorkflowExecutor(await orkesConductorClient({
  keyId: PUBLIC_NEXT_ORKES_KEY_ID,
  keySecret: PUBLIC_NEXT_ORKES_KEY_SECRET,
  serverUrl: PUBLIC_NEXT_ORKES_SERVER_URL,
}));

// Validate the client instance
if (!clientInstance) {
  throw new Error('Failed to initialize WorkflowExecutor client');
}

console.log('Orkes client initialized successfully');

/**
 * Starts the agentic_research workflow with the provided inputs.
 * @param {string} question - The research question to investigate.
 * @param {string} filename - The name of the uploaded PDF file.
 * @returns {Promise<string>} - The ID of the started workflow.
 */
export async function runAgenticResearch(question, filename) {
  console.log('Starting agentic_research with:', question, filename);

  // Start the workflow execution
  const workflowId = await clientInstance.startWorkflow({
    name: 'agentic_research',
    version: 2,
    input: {
      question,
      filename,
    },
  });

  // Manually update the save_pdf_ref task with mock output (optional or placeholder logic)
  clientInstance.updateTaskByRefName(
    "save_pdf_ref",
    workflowId,
    "COMPLETED",
    { some: { output: "value" } }
  );

  return workflowId;
}

/**
 * Retrieves the current status of a workflow by its ID.
 * @param {string} workflowId - The ID of the workflow to check.
 * @returns {Promise<string>} - The status of the workflow (e.g., RUNNING, COMPLETED).
 */
export async function getWorkflowStatus(workflowId) {
  try {
    // Validate the input workflow ID
    if (!workflowId) {
      throw new Error('Workflow ID is required');
    }

    console.log(`Fetching status for workflow ID: ${workflowId}`);

    // Retrieve the workflow status using the client
    const workflow = await clientInstance.getWorkflow(workflowId);

    // Validate the response
    if (!workflow || !workflow.status) {
      throw new Error('Invalid workflow response');
    }

    console.log(`Workflow status for ID ${workflowId}: ${workflow.status}`);
    return workflow.status;
  } catch (error) {
    console.error('Error in getWorkflowStatus:', error);
    throw error; // Re-throw the error to be handled upstream
  }
}

/**
 * Fetches the 'result' output field from a specific task in a workflow.
 * @param {string} workflowId - ID of the workflow run.
 * @param {string} taskRefName - Reference name of the target task.
 * @returns {Promise<string | null>} - Returns the result string, or null on failure.
 */
export async function getTaskResultByRefName(workflowId, taskRefName) {
  try {
    // Fetch the full workflow object by ID (includes task list and outputs)
    const workflow = await clientInstance.getWorkflow(workflowId);

    // Validate that workflow and its tasks are present
    if (!workflow || !workflow.tasks) {
      throw new Error('No tasks found in workflow');
    }

    // Find the task in the workflow that matches the given reference name
    const task = workflow.tasks.find(t => t.referenceTaskName === taskRefName);

    // Handle case where task with specified ref name is not found
    if (!task) {
      throw new Error(`Task with refName "${taskRefName}" not found`);
    }

    // Access the 'result' field from the task's outputData, safely
    const result = task.outputData?.result;

    // If 'result' field doesn't exist, treat it as an error
    if (!result) {
      throw new Error(`No 'result' output in task "${taskRefName}"`);
    }

    // Return the final result
    return result;
  } catch (err) {
    // Log the error and return null to allow graceful fallback
    console.error('Error fetching task result:', err);
    return null;
  }
}


