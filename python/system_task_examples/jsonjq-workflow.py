from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.workflow.task.json_jq_task import JsonJQTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask


def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # JQ script to transform user data
    jq_script = """
      .users | map({
        username: .login,
        profile_url: .html_url,
        avatar: .avatar_url
      })
    """

    # 1) Create the JSON JQ task
    jq_task = JsonJQTask(
        task_ref_name='transform_user_data',
        script=jq_script
    )
    jq_task.input_parameters.update({
        'users': '${workflow.input.users}'
    })

    # 2) Create the SetVariableTask to persist transformed result
    set_variable_task = SetVariableTask(
        task_ref_name='store_filtered_users'
    )
    set_variable_task.input_parameters.update({
        'filtered_users': '${transform_user_data.output.result}'
    })

    # Define and register the workflow
    workflow = ConductorWorkflow(
        name='simple_user_data_transform',
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.input_parameters = ['users']
    workflow.add(jq_task)
    workflow.add(set_variable_task)
    workflow.register(overwrite=True)
    return workflow


def main():
    api_config = Configuration()
    workflow_executor = WorkflowExecutor(configuration=api_config)

    workflow = register_workflow(workflow_executor)

    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

    # Provide user input data
    workflow_input = {
        'users': [
            {
                'login': 'alice123',
                'html_url': 'https://github.com/alice123',
                'avatar_url': 'https://avatars.githubusercontent.com/u/1?v=4',
                'email': 'alice@example.com',
                'bio': 'Developer'
            },
            {
                'login': 'bob456',
                'html_url': 'https://github.com/bob456',
                'avatar_url': 'https://avatars.githubusercontent.com/u/2?v=4',
                'email': 'bob@example.com',
                'bio': 'Engineer'
            }
        ]
    }

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
