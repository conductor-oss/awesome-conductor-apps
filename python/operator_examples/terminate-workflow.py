from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.simple_task import SimpleTask
from conductor.client.workflow.task.switch_task import SwitchTask
from conductor.client.workflow.task.terminate_task import TerminateTask, WorkflowStatus
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.worker.worker_task import worker_task


def register_shipping_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Decide based on shipping provider
    switch_provider = SwitchTask(
        task_ref_name="switch_provider",
        case_expression="${workflow.input.shipping_provider}"
    )

    # 2a) FedEx path
    fedex_task = SimpleTask(
        task_def_name="ship_with_fedex",
        task_reference_name="ship_with_fedex"
    )

    # 2b) UPS path
    ups_task = SimpleTask(
        task_def_name="ship_with_ups",
        task_reference_name="ship_with_ups"
    )

    # 3) Default path — Terminate the workflow if the provider is invalid
    terminate_task = TerminateTask(
        task_ref_name="terminate_invalid_provider",
        status=WorkflowStatus.FAILED,
        termination_reason="${workflow.input.termination_reason}"
    )

    # 4) Configure Switch task cases
    switch_provider.switch_case("FEDEX", [fedex_task])
    switch_provider.switch_case("UPS", [ups_task])
    switch_provider.default_case([terminate_task])

    workflow = ConductorWorkflow(
        name="shipping_workflow_with_validation",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(switch_provider)
    workflow.register(overwrite=True)

    return workflow


@worker_task(task_definition_name="ship_with_fedex")
def ship_with_fedex() -> dict:
    print("📦 Shipping with FedEx...")
    return {"status": "Shipped via FedEx"}


@worker_task(task_definition_name="ship_with_ups")
def ship_with_ups() -> dict:
    print("📦 Shipping with UPS...")
    return {"status": "Shipped via UPS"}


def main():
    config = Configuration()
    executor = WorkflowExecutor(configuration=config)

    # Register the shipping workflow
    workflow = register_shipping_workflow(executor)

    # Start worker processes
    task_handler = TaskHandler(
        workers=[],
        configuration=config,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()

    # Input: Try "FEDEX", "UPS", or invalid like "DHL"
    input_data = {
        "shipping_provider": "DHL",
        "termination_reason": "Invalid shipping provider"
    }

    print("🚀 Starting workflow...")
    workflow_run = executor.execute(
        name=workflow.name,
        version=workflow.version,
        workflow_input=input_data
    )

    print(f"✅ Workflow started with ID: {workflow_run.workflow_id}")
    print(f"🔗 View in UI: {config.ui_host}/execution/{workflow_run.workflow_id}")

    task_handler.stop_processes()


if __name__ == "__main__":
    main()
