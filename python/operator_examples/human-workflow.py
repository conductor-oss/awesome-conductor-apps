from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.http.models.start_workflow_request import StartWorkflowRequest
from conductor.client.worker.worker_task import worker_task
from conductor.client.automator.task_handler import TaskHandler

from conductor.client.workflow.task.simple_task import SimpleTask
from conductor.client.workflow.task.start_workflow_task import StartWorkflowTask
from conductor.client.workflow.task.human_task import HumanTask, AssignmentCompletionStrategy
from conductor.client.workflow.task.switch_task import SwitchTask
from conductor.client.workflow.conductor_workflow import ConductorWorkflow

import time


# --- Notification Workflow ---

def register_notification_workflow(executor: WorkflowExecutor) -> ConductorWorkflow:
    notify_task = SimpleTask(
        task_def_name="notify_expense_approval",
        task_reference_name="notify_expense_approval_ref"
    )

    workflow = ConductorWorkflow(
        name="notification_workflow",
        executor=executor
    )
    workflow.version = 1
    workflow.add(notify_task)
    workflow.register(overwrite=True)
    return workflow


# --- Expense Approval Workflow ---

def register_expense_approval_workflow(executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) HR Approval Step
    hr_approval = HumanTask(
        task_ref_name="hr_approval_task",
        display_name="HR Approval",
        form_template="expense_approval_form",
        form_version=1,
        assignment_completion_strategy=AssignmentCompletionStrategy.LEAVE_OPEN
    )

    check_hr = SwitchTask(
        task_ref_name="check_hr_approval",
        case_expression="${hr_approval_task.output.approvalStatus}"
    ).switch_case("APPROVED", [])

    # 2) Finance Approval Step
    finance_approval = HumanTask(
        task_ref_name="finance_approval_task",
        display_name="Finance Approval",
        form_template="expense_approval_form",
        form_version=1,
        assignment_completion_strategy=AssignmentCompletionStrategy.LEAVE_OPEN
    )

    check_finance = SwitchTask(
        task_ref_name="check_finance_approval",
        case_expression="${finance_approval_task.output.approvalStatus}"
    ).switch_case("APPROVED", [])

    # 3) Start Notification Workflow
    start_notification = StartWorkflowTask(
        task_ref_name="start_notification_workflow",
        workflow_name="notification_workflow",
        start_workflow_request=StartWorkflowRequest(
            name="notification_workflow",
            version=1,
            input={
                "expense_id": "${workflow.input.expense_id}",
                "submitted_by": "${workflow.input.submitted_by}"
            }
        ),
        version=1
    )

    # Add the notification task inside finance approval success branch
    check_finance.switch_case("APPROVED", [start_notification])

    # Add finance approval after HR approves
    check_hr.switch_case("APPROVED", [finance_approval, check_finance])

    workflow = ConductorWorkflow(
        name="expense_approval_workflow",
        executor=executor
    )
    workflow.version = 1
    workflow.add(hr_approval)
    workflow.add(check_hr)
    workflow.register(overwrite=True)
    return workflow


@worker_task(task_definition_name="notify_expense_approval")
def notify_expense_approval() -> dict:
    print("🔔 Expense approval notification sent.")
    return {"notified": True}


def main():
    config = Configuration()
    executor = WorkflowExecutor(configuration=config)

    # Register both workflows
    register_notification_workflow(executor)
    workflow = register_expense_approval_workflow(executor)

    # Start workers
    task_handler = TaskHandler(
        workers=[],
        configuration=config,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()

    input_data = {
        "expense_id": "EXP-20250416",
        "submitted_by": "jane.doe@example.com"
    }

    print("🚀 Starting expense approval workflow...")
    workflow_run = executor.execute(
        name=workflow.name,
        version=workflow.version,
        workflow_input=input_data
    )

    print(f"✅ Workflow started with ID: {workflow_run.workflow_id}")
    print(f"🔗 View in UI: {config.ui_host}/execution/{workflow_run.workflow_id}")

    # need to keep workers running for async workflos
    try:
        print("🧠 Workers running... Press Ctrl+C to exit.")
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        print("🛑 Stopping workers...")
        task_handler.stop_processes()


if __name__ == "__main__":
    main()
