from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask
from conductor.client.workflow.task.switch_task import SwitchTask


def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # Task to fetch order details
    fetch_order_details = HttpTask(
        task_ref_name="fetch_order_details",
        http_input={
            "uri": "https://jsonplaceholder.typicode.com/posts/${workflow.input.orderId}",
            "method": "GET",
            "headers": {
                "Content-Type": "application/json"
            }
        }
    )

    # SetVariable tasks for each shipping method
    standard_shipping = SetVariableTask(task_ref_name="standard_shipping_var")
    standard_shipping.input_parameters.update({
        "selected_shipping_method": "standard"
    })

    express_shipping = SetVariableTask(task_ref_name="express_shipping_var")
    express_shipping.input_parameters.update({
        "selected_shipping_method": "express"
    })

    overnight_shipping = SetVariableTask(task_ref_name="overnight_shipping_var")
    overnight_shipping.input_parameters.update({
        "selected_shipping_method": "overnight"
    })

    # Define the Switch task to route based on shippingType
    switch_shipping = SwitchTask(
        task_ref_name="switch_shipping_method",
        case_expression="${workflow.input.shippingType}"
    )
    switch_shipping \
        .switch_case("standard", [standard_shipping]) \
        .switch_case("express", [express_shipping]) \
        .switch_case("overnight", [overnight_shipping]) \
        .default_case([])

    # Create the workflow and add tasks
    workflow = ConductorWorkflow(
        name="order_processing_workflow",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(fetch_order_details)
    workflow.add(switch_shipping)

    # Register the workflow
    workflow.register(True)

    return workflow


def main():
    # Initialize Configuration
    api_config = Configuration()

    # Initialize Workflow Executor
    workflow_executor = WorkflowExecutor(configuration=api_config)

    # Register the workflow
    workflow = register_workflow(workflow_executor)

    # Start the worker polling mechanism
    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

    # Input for the workflow
    workflow_input = {
        "orderId": "1",
        "shippingType": "express"
    }

    # Execute the workflow
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
