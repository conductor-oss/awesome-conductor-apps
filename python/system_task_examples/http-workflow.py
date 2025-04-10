from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.workflow.task.switch_task import SwitchTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask

def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Define the HTTP task for calling the payment API
    http_task = HttpTask(
        task_ref_name="call_payment_api",  # Reference name for the task
        http_input={
            "uri": "https://httpbin.org/status/200", # Use a Payment API endpoint
            "method": "POST",  # HTTP method
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer ${workflow.input.auth_token}"  # Authorization token from workflow input
            },
            "body": {
                "orderId": "${workflow.input.orderId}",  # Order ID from workflow input
                "amount": "${workflow.input.amount}"  # Payment amount from workflow input
            }
        }
    )

    # 2) Define the SwitchTask with case expression
    switch_task = SwitchTask(
        task_ref_name="check_payment_status",  # Reference name for the switch task
        case_expression="${call_payment_api.output.response.statusCode}",  # Case expression (HTTP status code)
        use_javascript=False  # Use value-param evaluator type
    )

    # 3) Define SetVariableTask for success and failure cases
    set_payment_success_variable = SetVariableTask(
        task_ref_name="set_payment_success_variable"
    )
    set_payment_success_variable.input_parameters.update({
        'payment_status': 'SUCCESS'  # Set the payment status to success
    })

    set_payment_failure_variable = SetVariableTask(
        task_ref_name="set_payment_failure_variable"
    )
    set_payment_failure_variable.input_parameters.update({
        'payment_status': 'FAILURE'  # Set the payment status to failure
    })

    # Configure the decision cases for the SwitchTask
    switch_task.switch_case("200", set_payment_success_variable)  # Case for success (HTTP status 200)
    switch_task.default_case(set_payment_failure_variable)  # Default case for failure

    # Define the workflow and add the tasks
    workflow = ConductorWorkflow(
        name="payment_workflow",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(http_task)  # Add the HTTP task to call the payment API
    workflow.add(switch_task)  # Add the switch task to check the payment status

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
        "orderId": "ORD-00123",
        "amount": 100.0,
        "auth_token": "your_authorization_token"
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
