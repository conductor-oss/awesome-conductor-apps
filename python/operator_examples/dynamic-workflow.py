from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.workflow.task.dynamic_task import DynamicTask
from conductor.client.workflow.task.simple_task import SimpleTask
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.worker.worker_task import worker_task


def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Task to simulate courier selection
    shipping_info = HttpTask(
        task_ref_name="shipping_info_ref",
        http_input={
            "uri": "https://jsonplaceholder.typicode.com/posts",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "order_id": "${workflow.input.order_id}",
                "destination": "${workflow.input.address}"
            }
        }
    )

    # 2) Dynamic task that picks the shipping method based on output
    dynamic_shipping = DynamicTask(
        dynamic_task="${workflow.input.shipping_service}",
        task_reference_name="dynamic_shipping"
    )
    # dynamic_shipping = SimpleTask(
    #     task_def_name="ship_via_fedex",
    #     task_reference_name="ship_via_fedex"
    # )

    workflow = ConductorWorkflow(
        name="Shipping_Flow",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(shipping_info)
    workflow.add(dynamic_shipping)
    workflow.register(overwrite=True)
    return workflow


# Worker for FedEx
@worker_task(task_definition_name="ship_via_fedex")
def ship_via_fedex() -> dict:
    print("📦 Shipping via FedEx")
    return {"status": "FedEx shipment created"}

# Worker for UPS
@worker_task(task_definition_name="ship_via_ups")
def ship_via_ups() -> dict:
    print("📦 Shipping via UPS")
    return {"status": "UPS shipment created"}


def main():
    config = Configuration()
    executor = WorkflowExecutor(configuration=config)
    workflow = register_workflow(executor)

    # Register task workers
    task_handler = TaskHandler(workers=[], configuration=config, scan_for_annotated_workers=True)
    task_handler.start_processes()

    # Execute workflow with sample input
    workflow_input = {
        "order_id": "ORDER-001",
        "address": "456 Delivery Lane, Boston, MA",
        "shipping_service": "ship_via_fedex"
    }

    workflow_run = executor.execute(
        name=workflow.name,
        version=workflow.version,
        workflow_input=workflow_input
    )

    print(f"✅ Workflow started with ID: {workflow_run.workflow_id}")
    print(f"🔗 View in UI: {config.ui_host}/execution/{workflow_run.workflow_id}")

    task_handler.stop_processes()


if __name__ == "__main__":
    main()
