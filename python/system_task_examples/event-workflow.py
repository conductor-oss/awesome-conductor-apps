from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.workflow.task.event_task import EventTaskInterface

def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Define the HTTP task for calling the dummy JSONPlaceholder API
    http_task = HttpTask(
        task_ref_name="fetch_order_details",  # Reference name for the task
        http_input={
            "uri": "https://jsonplaceholder.typicode.com/posts/${workflow.input.orderId}",  # Dummy API endpoint
            "method": "GET",  # HTTP method (GET)
            "headers": {
                "Content-Type": "application/json"
            }
        }
    )

    # 2) Define the Event task using EventTaskInterface
    event_task = EventTaskInterface(
        task_ref_name="notify_inventory",  # Reference name for the task
        event_prefix="kafka",  # Prefix for the event
        event_suffix="quickstart-events"  # Event name that will be triggered
    )

    # Update input parameters for the event task, using data from the HTTP task response
    event_task.input_parameters.update({
        'orderId': '${fetch_order_details.output.response.body.id}',
        'title': '${fetch_order_details.output.response.body.title}',
        'body': '${fetch_order_details.output.response.body.body}'
    })

    # Define the workflow and add the HTTP and Event tasks to the workflow
    workflow = ConductorWorkflow(
        name="inventory_management_workflow",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(http_task)
    workflow.add(event_task)

    # Register the workflow
    workflow.register(True)

    return workflow

def main():
    # Initialize Configuration (API configuration)
    api_config = Configuration()

    # Initialize Workflow Executor
    workflow_executor = WorkflowExecutor(configuration=api_config)

    # Register the workflow
    workflow = register_workflow(workflow_executor)

    # Starting the worker polling mechanism
    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

    # Input for the workflow
    workflow_input = {
        "orderId": "1",  # Using '1' as the ID for the JSONPlaceholder mock API
        "auth_token": "your_authorization_token"  # Optional: Include authorization token if needed
    }

    # Start workflow execution
    workflow_run = workflow_executor.execute(
        name=workflow.name,
        version=workflow.version,
        workflow_input=workflow_input
    )

    print(f"Started workflow ID: {workflow_run.workflow_id}")
    print(f"View in UI: {api_config.ui_host}/execution/{workflow_run.workflow_id}")

    # Stop task handler after execution
    task_handler.stop_processes()


if __name__ == '__main__':
    main()
