import json
import logging
import logging
import os

from conductor.client.automator.task_handler import TaskHandler
from conductor.client.configuration.configuration import Configuration
from conductor.client.http.models import StartWorkflowRequest
from conductor.client.metadata_client import MetadataClient
from conductor.client.orkes_clients import OrkesClients
from worker.workers import *
from prompts import configure_integrations
from dotenv import load_dotenv

# Define task_handler as a global variable
task_handler = None
workflow_client = None
load_dotenv()

def start_workers(api_config):
    task_handler = TaskHandler(
        workers=[],
        configuration=api_config,
        scan_for_annotated_workers=True,
    )
    task_handler.start_processes()
    return task_handler


def add_agentic_workflow(path: str, metadata_client: MetadataClient):
    with open(path, 'r') as file:
        data = json.load(file)
    return metadata_client.register_workflow_def(workflow_def=data, overwrite=True)

def stop_workflow():
    print('The interview has terminated unexpectedly.')
    if task_handler:
        task_handler.stop_processes()
    if workflow_client:
        workflow_client.terminate_workflow(os.environ['WORKFLOW_ID'])

def stop_workers():
    print('The interview has completed successfully.')
    if task_handler:
        task_handler.stop_processes()

def is_workflow_running(workflow_id):
    workflow = workflow_client.get_workflow(workflow_id=workflow_id, include_tasks=False)
    return workflow.status == 'RUNNING'

def start_workflow():
    global workflow_client
    global task_handler

    api_config = Configuration()
    api_config.apply_logging_config(level=logging.INFO)
    clients = OrkesClients(configuration=api_config)
    workflow_client = clients.get_workflow_client()
    metadata_client = clients.get_metadata_client()

    task_handler = start_workers(api_config=api_config)

    # Configure integrations using the function from prompts.py (one-time setup)
    configure_integrations(api_config=api_config)

    add_agentic_workflow(path='../resources/interviewAgenticWorkflow.json', metadata_client=metadata_client)
    add_agentic_workflow(path='../resources/coreInterviewLoop.json', metadata_client=metadata_client)

    request = StartWorkflowRequest(name='Interview Agentic Workflow', version=1)

    workflow_id = workflow_client.start_workflow(start_workflow_request=request)
    os.environ['WORKFLOW_ID'] = workflow_id
    workflow = workflow_client.get_workflow(workflow_id=workflow_id, include_tasks=False)
    print(f'track the agent execution here {os.getenv("CONDUCTOR_SERVER_URL")}/../execution/{workflow.workflow_id}')
