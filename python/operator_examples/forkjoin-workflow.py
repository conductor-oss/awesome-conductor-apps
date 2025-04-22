from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.simple_task import SimpleTask
from conductor.client.workflow.task.fork_task import ForkTask
from conductor.client.workflow.task.join_task import JoinTask
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.worker.worker_task import worker_task


def register_notification_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Define each notification path
    email_branch = [
        SimpleTask(task_def_name="process_notification_payload", task_reference_name="process_notification_payload_email"),
        SimpleTask(task_def_name="email_notification", task_reference_name="email_notification_ref")
    ]

    sms_branch = [
        SimpleTask(task_def_name="process_notification_payload", task_reference_name="process_notification_payload_sms"),
        SimpleTask(task_def_name="sms_notification", task_reference_name="sms_notification_ref")
    ]

    http_branch = [
        SimpleTask(task_def_name="process_notification_payload", task_reference_name="process_notification_payload_http"),
        HttpTask(
            task_ref_name="http_notification_ref",
            http_input={
                "uri": "${workflow.input.http_target_url}",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": {
                    "message": "Notification triggered"
                }
            }
        )
    ]

    # 2) Fork-Join setup (only join on email + sms)
    fork_join = ForkTask(
        task_ref_name="my_fork_join_ref",
        forked_tasks=[email_branch, sms_branch, http_branch],
        join_on=["email_notification_ref", "sms_notification_ref"]
    )

    # Create and register workflow
    workflow = ConductorWorkflow(
        name="notification_workflow_with_fork_join",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(fork_join)
    workflow.register(overwrite=True)

    return workflow


@worker_task(task_definition_name="process_notification_payload")
def process_notification_payload() -> dict:
    print("🛠️ Processing notification payload...")
    return {"payload_processed": True}


@worker_task(task_definition_name="email_notification")
def email_notification() -> dict:
    print("📧 Email sent to test@example.com")
    return {
        "email_sent_at": "2021-11-06T07:37:17+0000",
        "email_sent_to": "test@example.com"
    }


@worker_task(task_definition_name="sms_notification")
def sms_notification() -> dict:
    print("📱 SMS sent to +1-xxx-xxx-xxxx")
    return {
        "sms_sent_at": "2021-11-06T07:37:17+0129",
        "sms_sent_to": "+1-xxx-xxx-xxxx"
    }


def main():
    config = Configuration()
    executor = WorkflowExecutor(configuration=config)

    # Register the notification workflow
    workflow = register_notification_workflow(executor)

    # Start workers
    task_handler = TaskHandler(
        workers=[],
        configuration=config,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()

    input_data = {
        "recipient_email": "test@example.com",
        "recipient_phone": "+1-xxx-xxx-xxxx",
        "http_target_url": "https://httpbin.org/status/200"
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
