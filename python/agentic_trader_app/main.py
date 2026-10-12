import json
import os
import pathlib
import sys
import time

from conductor.client.automator.task_handler import TaskHandler
from conductor.client.configuration.configuration import Configuration
from conductor.client.http.models import StartWorkflowRequest
from conductor.client.orkes_clients import OrkesClients

from worker import workers  # noqa: F401 (registers the @worker_task functions)

WORKFLOW = pathlib.Path(__file__).parent / 'resources' / 'workflow.json'


def main():
    api_config = Configuration()
    clients = OrkesClients(configuration=api_config)
    workflow_client = clients.get_workflow_client()

    with open(WORKFLOW) as f:
        clients.get_metadata_client().register_workflow_def(workflow_def=json.load(f), overwrite=True)

    task_handler = TaskHandler(workers=[], configuration=api_config, scan_for_annotated_workers=True)
    task_handler.start_processes()
    try:
        request = StartWorkflowRequest(name='agentic_stock_trader_autonomous', version=1, input={
            'instructions': ' '.join(sys.argv[1:]) or 'Trade actively to grow the account',
            'model': os.getenv('OPENAI_DEFAULT_MODEL', 'gpt-5-nano'),
        })
        workflow_id = workflow_client.start_workflow(start_workflow_request=request)
        print(f'Track the agent here: {api_config.ui_host}/execution/{workflow_id}')

        last_trade = 'None yet'
        try:
            workflow = workflow_client.get_workflow(workflow_id=workflow_id, include_tasks=False)
            while workflow.is_running():
                v = workflow.variables or {}
                if v.get('last_trade', last_trade) != last_trade:
                    last_trade = v['last_trade']
                    print(f'{last_trade} | cash: {v.get("balance")} | total value: {v.get("total_value")} ({v.get("change_percent")}%)')
                time.sleep(2)
                workflow = workflow_client.get_workflow(workflow_id=workflow_id, include_tasks=False)
        except KeyboardInterrupt:
            # Ctrl+C: terminate the workflow too, so it isn't left waiting for the stopped workers
            print('\nStopping the agent...')
            workflow_client.terminate_workflow(workflow_id=workflow_id, reason='Stopped with Ctrl+C')
            workflow = workflow_client.get_workflow(workflow_id=workflow_id, include_tasks=False)

        print(f'Agent {workflow.status}: {json.dumps(workflow.output, indent=2)}')
    finally:
        task_handler.stop_processes()


if __name__ == '__main__':
    main()
