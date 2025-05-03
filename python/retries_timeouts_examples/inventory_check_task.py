from conductor.client.configuration.configuration import Configuration
from conductor.client.http.models import TaskDef
from conductor.client.orkes_clients import OrkesClients


def main():
    api_config = Configuration()
    clients = OrkesClients(configuration=api_config)
    metadata_client = clients.get_metadata_client()

    task_def = TaskDef()
    task_def.name = 'inventory_check_task'
    task_def.description = 'Check inventory status with timeout and retry settings'
    
    # Retry settings
    task_def.retry_count = 2
    task_def.retry_logic = 'FIXED'
    task_def.retry_delay_seconds = 5

    # Timeout settings
    task_def.timeout_seconds = 30
    task_def.poll_timeout_seconds = 10
    task_def.response_timeout_seconds = 15
    task_def.timeout_policy = 'RETRY'

    metadata_client.register_task_def(task_def=task_def)

    print(f'Registered the task -- view at {api_config.ui_host}/taskDef/{task_def.name}')


if __name__ == '__main__':
    main()
