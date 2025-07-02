'use server';

import { orkesConductorClient, WorkflowExecutor } from '@io-orkes/conductor-javascript';

// Singleton client initialization to avoid re-instantiating
let clientInstance = null;

/**
 * Initializes and caches the Orkes WorkflowExecutor.
 * Only runs on the server.
 */
/**
 * Initializes and caches the Orkes WorkflowExecutor.
 * Only runs on the server.
 */
async function getWorkflowExecutor() {
  if (!clientInstance) {
    try {
      // Validate environment variables
      const { PUBLIC_NEXT_ORKES_KEY_ID, PUBLIC_NEXT_ORKES_KEY_SECRET, PUBLIC_NEXT_ORKES_SERVER_URL } = process.env;
      if (!PUBLIC_NEXT_ORKES_KEY_ID || !PUBLIC_NEXT_ORKES_KEY_SECRET || !PUBLIC_NEXT_ORKES_SERVER_URL) {
        throw new Error('Missing required environment variables: PUBLIC_NEXT_ORKES_KEY_ID, PUBLIC_NEXT_ORKES_KEY_SECRET, PUBLIC_NEXT_ORKES_SERVER_URL');
      }

      console.log('Initializing Orkes client with:', {
        keyId: PUBLIC_NEXT_ORKES_KEY_ID,
        keySecret: PUBLIC_NEXT_ORKES_KEY_SECRET ? '***' : 'undefined',
        serverUrl: PUBLIC_NEXT_ORKES_SERVER_URL,
      });

      // Initialize the WorkflowExecutor client
      const conductorClient = await orkesConductorClient({
        keyId: PUBLIC_NEXT_ORKES_KEY_ID,
        keySecret: PUBLIC_NEXT_ORKES_KEY_SECRET,
        serverUrl: PUBLIC_NEXT_ORKES_SERVER_URL,
      });

      clientInstance = new WorkflowExecutor(conductorClient);

      // Validate the client instance
      if (!clientInstance || !clientInstance.client) {
        throw new Error('Failed to initialize WorkflowExecutor client');
      }
    } catch (error) {
      console.error('Error initializing WorkflowExecutor:', error);
      throw error; // Re-throw the error for the calling code to handle
    }
  }

  return clientInstance;
}



/**
 * Starts the agentic_research workflow with the provided inputs.
 * @param {string} question - Research question.
 * @param {string} filename - Name of the associated PDF file.
 * @returns {Promise<string>} - The started workflow ID.
 */
export async function runAgenticResearch(question, filename) {
  console.log('Starting agentic_research with:', question, filename);
  const executor = await getWorkflowExecutor();

  const workflowId = await executor.startWorkflow({
    name: 'agentic_research',
    version: 2,
    input: {
      question,
      filename,
    },
  });

  return workflowId;
}

/**
 * Retrieves the status of a workflow by its ID.
 * @param {string} workflowId
 * @returns {Promise<string>} - Workflow status (e.g. RUNNING, COMPLETED)
 */
export async function getWorkflowStatus(workflowId) {
  try {
    // Validate the workflow ID
    if (!workflowId) {
      throw new Error('Workflow ID is required');
    }
    console.log('client instance:', clientInstance);

    const executor = await getWorkflowExecutor();

    // Validate the executor and its client
    if (!executor || !executor.client) {
      throw new Error('WorkflowExecutor client is not initialized');
    }

    console.log(`Fetching status for workflow ID: ${workflowId}`);

    // Retrieve the workflow status
    const workflow = await executor.client.getWorkflow(workflowId);

    // Validate the workflow response
    if (!workflow || !workflow.status) {
      throw new Error('Invalid workflow response');
    }

    console.log(`Workflow status for ID ${workflowId}: ${workflow.status}`);
    return workflow.status;
  } catch (error) {
    console.error('Error in getWorkflowStatus:', error);
    throw error; // Re-throw the error for the calling code to handle
  }
}