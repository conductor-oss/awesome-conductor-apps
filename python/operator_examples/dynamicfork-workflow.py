from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.simple_task import SimpleTask
from conductor.client.workflow.task.join_task import JoinTask
from conductor.client.workflow.task.dynamic_fork_task import DynamicForkTask
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.worker.worker_task import worker_task

def register_moderation_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Define Join task
    join_task = JoinTask(
        task_ref_name="join_ref",
        join_on=[]
    )

    # 2) Define Dynamic Fork Task with inputParameters dict
    dynamic_fork = DynamicForkTask(
        task_ref_name="fork_join_dynamic_ref",
        join_task=join_task
    )
    dynamic_fork.input_parameters.update({
        "dynamicTasks": "${workflow.input.dynamicTasks}",
        "dynamicTasksInputs": "${workflow.input.dynamicTasksInputs}"
    })

    # Construct the workflow
    workflow = ConductorWorkflow(
        name="DynamicForkExample",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(dynamic_fork)
    workflow.register(overwrite=True)

    return workflow


@worker_task(task_definition_name="moderate_text")
def moderate_text() -> dict:
    print("📝 Moderating text...")
    return {"status": "Text moderation complete"}


@worker_task(task_definition_name="moderate_image")
def moderate_image() -> dict:
    print("🖼️ Moderating image...")
    return {"status": "Image moderation complete"}


@worker_task(task_definition_name="moderate_video")
def moderate_video() -> dict:
    print("🎥 Moderating video...")
    return {"status": "Video moderation complete"}


def main():
    config = Configuration()
    executor = WorkflowExecutor(configuration=config)

    # Register the workflow
    workflow = register_moderation_workflow(executor)

    # Start worker processes
    task_handler = TaskHandler(
        workers=[],
        configuration=config,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()

    # Input: dynamic tasks and their respective inputs
    input_data = {
        "dynamicTasks": [
            {
                "name": "moderate_text",
                "taskReferenceName": "task_text",
                "type": "SIMPLE"
            },
            {
                "name": "moderate_image",
                "taskReferenceName": "task_image",
                "type": "SIMPLE"
            },
            {
                "name": "moderate_video",
                "taskReferenceName": "task_video",
                "type": "SIMPLE"
            }
        ],
        "dynamicTasksInputs": {
            "task_text": {"content": "This is a test comment with no bad words."},
            "task_image": {"image_url": "https://example.com/image.jpg"},
            "task_video": {"video_url": "https://example.com/video.mp4"}
        }
    }

    print("🚀 Starting dynamic fork workflow...")
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
