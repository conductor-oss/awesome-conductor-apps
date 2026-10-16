from conductor.client.automator.task_handler import TaskHandler
from conductor.client.configuration.configuration import Configuration

from worker import sitemap_loader
from worker import github_loader
from worker import web_page_loader

def start_workers(api_config):
    print("- Starting task handler...")
    task_handler = TaskHandler(
        workers=[],
        configuration=api_config,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()
    return task_handler


def main():
    api_config = Configuration()
    task_handler = start_workers(api_config=api_config)
    task_handler.join_processes()


if __name__ == '__main__':
    main()
