from conductor.client.configuration.configuration import Configuration
from conductor.client.http.models import TaskDef
from conductor.client.orkes_clients import OrkesClients


def main():
    api_config = Configuration()
    clients = OrkesClients(configuration=api_config)
    metadata_client = clients.get_metadata_client()

    task_def = TaskDef()
    task_def.name = 'send_email_task'
    task_def.description = 'Send an email with retry on intermittent failures'
    task_def.retry_count = 3
    task_def.retry_logic = 'EXPONENTIAL_BACKOFF'
    task_def.retry_delay_seconds = 2
    task_def.backoff_scale_factor = 2

    metadata_client.register_task_def(task_def=task_def)

    print(f'Registered the task -- view at {api_config.ui_host}/taskDef/{task_def.name}')


if __name__ == '__main__':
    main()
