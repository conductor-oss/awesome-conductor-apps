from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.sub_workflow_task import SubWorkflowTask
from conductor.client.workflow.task.simple_task import SimpleTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.worker.worker_task import worker_task


# --- Payment Workflow (Sub-Workflow for Subscription) ---

def register_payment_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Process payment (for subscription)
    process_payment = SimpleTask(
        task_def_name="process_payment",
        task_reference_name="process_payment"
    )
    process_payment.input_parameters.update({
        "amount": "${workflow.input.amount}"
    })

    # Define and register the payment workflow
    workflow = ConductorWorkflow(
        name="payment_for_subscription",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(process_payment)
    workflow.register(overwrite=True)

    return workflow


# --- Subscription Workflow Definition (using Sub-Workflow) ---

def register_subscription_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Check if the user is subscribed
    check_status = SimpleTask(
        task_def_name="check_subscription_status",
        task_reference_name="check_subscription_status"
    )

    # 2) Trigger payment using sub-workflow
    trigger_payment = SubWorkflowTask(
        task_ref_name="trigger_payment",
        workflow_name="payment_for_subscription",  # The sub-workflow to invoke
        version=1
    )
    trigger_payment.input_parameters.update({
            "amount": "${workflow.input.amount}",  # Mapping input to sub-workflow
            "subscription_id": "${workflow.input.subscription_id}",
            "user_id": "${workflow.input.user_id}"
    })

    # 3) Send welcome email
    send_email = SimpleTask(
        task_def_name="send_welcome_email",
        task_reference_name="send_welcome_email"
    )

    # Assemble the subscription workflow
    workflow = ConductorWorkflow(
        name="subscription_management",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(check_status)
    workflow.add(trigger_payment)
    workflow.add(send_email)
    workflow.register(overwrite=True)

    return workflow


@worker_task(task_definition_name="check_subscription_status")
def check_subscription_status() -> dict:
    print("📡 Checking subscription status...")
    return {"status": "active"}


@worker_task(task_definition_name="send_welcome_email")
def send_welcome_email() -> dict:
    print("📨 Sending welcome email to subscriber...")
    return {"status": "email_sent"}


@worker_task(task_definition_name="process_payment")
def process_payment(amount) -> dict:
    print(f"💰 Charging customer: ${amount.input_data['amount']}")
    return {"status": "Payment successful"}


def main():
    config = Configuration()
    executor = WorkflowExecutor(configuration=config)

    # Register both workflows
    register_payment_workflow(executor)
    register_subscription_workflow(executor)

    # Start workers
    task_handler = TaskHandler(
        workers=[],
        configuration=config,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()

    # Sample input to execute the subscription workflow
    input_data = {
        "subscription_id": "SUB-2025-0001",
        "user_id": "USER-8765",
        "amount": 99.99  # Payment amount for the subscription
    }

    print("🚀 Starting subscription workflow...")
    workflow_run = executor.execute(
        name="subscription_management",
        version=1,
        workflow_input=input_data
    )

    print(f"✅ Workflow started with ID: {workflow_run.workflow_id}")
    print(f"🔗 View in UI: {config.ui_host}/execution/{workflow_run.workflow_id}")

    task_handler.stop_processes()


if __name__ == "__main__":
    main()
