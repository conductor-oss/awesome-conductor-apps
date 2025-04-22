from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.workflow.task.wait_task import WaitTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask
from conductor.client.automator.task_handler import TaskHandler


def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Simulate account provisioning
    provision_account = HttpTask(
        task_ref_name="provision_account",
        http_input={
            "uri": "https://jsonplaceholder.typicode.com/users",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "employeeId": "${workflow.input.employeeId}",
                "email": "${workflow.input.email}"
            }
        }
    )

    # 2) Send welcome materials
    send_welcome = HttpTask(
        task_ref_name="send_welcome_materials",
        http_input={
            "uri": "https://jsonplaceholder.typicode.com/posts",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "employeeId": "${workflow.input.employeeId}",
                "message": "Welcome to the company!"
            }
        }
    )

    # 3) Wait for the new employee to submit verification (simulate with 10s wait)
    wait_for_input = WaitTask(
        task_ref_name="wait_for_employee_response",
        wait_for_seconds=10
    )

    # 4) Assign a manager
    assign_manager = SetVariableTask(task_ref_name="assign_manager")
    assign_manager.input_parameters.update({
        "manager": "alice.smith@company.com"
    })

    # 5) Schedule training
    schedule_training = SetVariableTask(task_ref_name="schedule_training")
    schedule_training.input_parameters.update({
        "training_date": "2025-04-20"
    })

    # Define and register the workflow
    workflow = ConductorWorkflow(
        name="employee_onboarding_workflow",
        executor=workflow_executor
    )
    workflow.version = 1

    workflow.add(provision_account)
    workflow.add(send_welcome)
    workflow.add(wait_for_input)
    workflow.add(assign_manager)
    workflow.add(schedule_training)

    workflow.register(overwrite=True)
    return workflow


def main():
    api_config = Configuration()
    workflow_executor = WorkflowExecutor(configuration=api_config)
    workflow = register_workflow(workflow_executor)

    # Start polling for any task workers (not strictly needed here, but standard setup)
    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

    # Run the workflow
    workflow_input = {
        "employeeId": "emp123",
        "email": "emp123@example.com"
    }

    workflow_run = workflow_executor.execute(
        name=workflow.name,
        version=workflow.version,
        workflow_input=workflow_input
    )

    print(f"✅ Started workflow ID: {workflow_run.workflow_id}")
    print(f"🔗 View in UI: {api_config.ui_host}/execution/{workflow_run.workflow_id}")

    task_handler.stop_processes()


if __name__ == '__main__':
    main()
