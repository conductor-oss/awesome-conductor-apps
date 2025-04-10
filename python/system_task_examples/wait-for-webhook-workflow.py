from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.workflow.task.wait_for_webhook_task import WaitForWebHookTask
from conductor.client.workflow.task.http_task import HttpTask

def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Define the WaitForWebhookTask
    wait_for_comment_task = WaitForWebHookTask(
        task_ref_name='wait_for_comment',
        matches={
            "$['comment']['author']": "user123"
        }
    )

    # 2) Store the comment in a mock db once triggered, including the comment content from the wait_for_comment task
    store_comment_task = HttpTask(
        task_ref_name="store_comment",
        http_input={
            "uri": "https://jsonplaceholder.typicode.com/posts",  # URL for mock db
            "method": "POST",  # HTTP POST method to store the comment
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "comment_body": "${wait_for_comment.output.comment.body}",
                "author": "user123"
            }
        }
    )

    # Register the workflow
    workflow = ConductorWorkflow(
        name='comment_trigger_workflow',
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(wait_for_comment_task)
    workflow.add(store_comment_task)
    workflow.register(overwrite=True)
    return workflow

def main():
    api_config = Configuration()
    workflow_executor = WorkflowExecutor(configuration=api_config)

    workflow = register_workflow(workflow_executor)

    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

    # Provide no input for this simplified use case
    workflow_input = {}

    workflow_run = workflow_executor.execute(
        name=workflow.name,
        version=workflow.version,
        workflow_input=workflow_input
    )

    print(f"Started workflow ID: {workflow_run.workflow_id}")
    print(f"View in UI: {api_config.ui_host}/execution/{workflow_run.workflow_id}")

    task_handler.stop_processes()


if __name__ == '__main__':
    main()
