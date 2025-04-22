from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.simple_task import SimpleTask
from conductor.client.workflow.task.start_workflow_task import StartWorkflowTask
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.worker.worker_task import worker_task
from conductor.client.http.models.start_workflow_request import StartWorkflowRequest
import time


# --- Email Receipt Workflow (Sub-Workflow for emails) ---

def register_email_receipt_workflow(executor: WorkflowExecutor) -> ConductorWorkflow:
    email_task = SimpleTask(
        task_def_name="send_receipt_email",
        task_reference_name="send_receipt_email_ref"
    )

    workflow = ConductorWorkflow(
        name="email_receipt_workflow",
        executor=executor
    )
    workflow.version = 1
    workflow.add(email_task)
    workflow.register(overwrite=True)
    return workflow


# --- Main Checkout Workflow Definition (using Sub-Workflow) ---

def register_checkout_workflow(executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Task to process payment
    payment_task = SimpleTask(
        task_def_name="process_payment",
        task_reference_name="process_payment_ref"
    )

    # 2) Task to asynchronously start email_receipt_workflow
    start_email_workflow_input = StartWorkflowRequest(
        name="email_receipt_workflow",
        version=1,
        input={
            "customer_email": "${workflow.input.customer_email}",
            "order_id": "${workflow.input.order_id}"
        }
    )

    start_email_workflow_task = StartWorkflowTask(
        task_ref_name="start_email_workflow_ref",
        workflow_name="email_receipt_workflow",
        start_workflow_request=start_email_workflow_input,
        version=1
    )

    workflow = ConductorWorkflow(
        name="checkout_workflow",
        executor=executor
    )
    workflow.version = 1
    workflow.add(payment_task)
    workflow.add(start_email_workflow_task)
    workflow.register(overwrite=True)
    return workflow


@worker_task(task_definition_name="process_payment")
def process_payment() -> dict:
    print("💳 Payment processed successfully.")
    return {"payment_status": "success"}


@worker_task(task_definition_name="send_receipt_email")
def send_receipt_email() -> dict:
    print("📧 Receipt email sent to customer.")
    return {"email_status": "sent"}


def main():
    config = Configuration()
    executor = WorkflowExecutor(configuration=config)

    # Register both workflows
    register_email_receipt_workflow(executor)
    register_checkout_workflow(executor)

    # Start workers
    task_handler = TaskHandler(
        workers=[],
        configuration=config,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()

    # Trigger the checkout workflow
    input_data = {
        "customer_email": "buyer@example.com",
        "order_id": "ORD-12345"
    }

    print("🚀 Starting checkout workflow...")
    run = executor.execute(
        name="checkout_workflow",
        version=1,
        workflow_input=input_data
    )

    print(f"✅ Workflow started: {run.workflow_id}")
    print(f"🔗 UI Link: {config.ui_host}/execution/{run.workflow_id}")

    # need to keep workers running for async workflow
    try:
        print("🧠 Workers running... Press Ctrl+C to exit.")
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        print("🛑 Stopping workers...")
        task_handler.stop_processes()


if __name__ == "__main__":
    main()
