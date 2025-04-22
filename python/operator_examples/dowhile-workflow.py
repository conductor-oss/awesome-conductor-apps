from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.do_while_task import LoopTask
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.automator.task_handler import TaskHandler


def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Task to simulate review step with HTTP POST
    review_task = HttpTask(
        task_ref_name="log_review_comment",
        http_input={
            "uri": "https://jsonplaceholder.typicode.com/posts",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "reviewer": "${review_ticket_loop.output.item}",
                "comment": "Reviewed and updated by ${review_ticket_loop.output.item}"
            }
        }
    )

    # 2) DoWhileTask to iterate over reviewer stages
    review_loop = LoopTask(
        task_ref_name="review_ticket_loop",
        iterations=3,
        tasks=[review_task]
    )
    review_loop.input_parameters.update({
        "items": ["support_agent", "qa_team", "team_lead"]
    })

    # Define the workflow and register it
    workflow = ConductorWorkflow(
        name="ticket_review_workflow",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(review_loop)
    workflow.register(overwrite=True)

    return workflow


def main():
    api_config = Configuration()
    workflow_executor = WorkflowExecutor(configuration=api_config)
    workflow = register_workflow(workflow_executor)

    # Start polling for tasks
    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

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
