import argparse
import json
import pathlib
import time

from conductor.client.configuration.configuration import Configuration
from conductor.client.http.models import StartWorkflowRequest, TaskDef
from conductor.client.orkes_clients import OrkesClients

RESOURCES = pathlib.Path(__file__).parent / 'resources'
WORKFLOWS = ['index_page', 'index_site', 'github_repo_index', 'site-search']

DEFAULT_SITEMAP = 'https://conductor-oss.org/sitemap.xml'
DEFAULT_REPO = 'https://github.com/conductor-oss/awesome-conductor-apps'


def task_def(name: str, timeout_seconds: int, retry_count: int, concurrent_exec_limit: int = None) -> TaskDef:
    td = TaskDef(name=name)
    td.owner_email = 'rag-demo@example.com'
    td.timeout_seconds = timeout_seconds
    td.response_timeout_seconds = timeout_seconds
    td.retry_count = retry_count
    td.retry_logic = 'EXPONENTIAL_BACKOFF'
    td.retry_delay_seconds = 2
    if concurrent_exec_limit:
        td.concurrent_exec_limit = concurrent_exec_limit
    return td


def register(clients: OrkesClients):
    metadata_client = clients.get_metadata_client()
    # Workers (see main.py)
    metadata_client.register_task_def(task_def('sitemap_urls', 60, 2))
    metadata_client.register_task_def(task_def('load_web_page', 60, 2))
    metadata_client.register_task_def(task_def('load_github_repo', 600, 1))
    # LLM_INDEX_TEXT system task used for every chunk: retry with backoff and cap
    # concurrency so large indexing runs stay under the embedding API rate limits
    metadata_client.register_task_def(task_def('rag_index_chunk', 120, 3, concurrent_exec_limit=20))

    for name in WORKFLOWS:
        with open(RESOURCES / f'{name}.json') as f:
            metadata_client.register_workflow_def(workflow_def=json.load(f), overwrite=True)
        print(f'Registered workflow {name}')


def run(clients: OrkesClients, name: str, workflow_input: dict, ui_host: str) -> dict:
    workflow_client = clients.get_workflow_client()
    workflow_id = workflow_client.start_workflow(StartWorkflowRequest(name=name, version=1, input=workflow_input))
    print(f'Started {name}: {ui_host}/execution/{workflow_id}')
    workflow = workflow_client.get_workflow(workflow_id=workflow_id, include_tasks=False)
    while workflow.is_running():
        time.sleep(5)
        workflow = workflow_client.get_workflow(workflow_id=workflow_id, include_tasks=False)
    print(f'{name} {workflow.status}: {json.dumps(workflow.output)}')
    return workflow.output


def main():
    parser = argparse.ArgumentParser(description='Register the RAG workflows and index a site and/or a GitHub repo')
    parser.add_argument('--sitemap', help=f'sitemap URL to index (default: {DEFAULT_SITEMAP})')
    parser.add_argument('--max-pages', type=int, default=150, help='maximum number of sitemap pages to index')
    parser.add_argument('--repo', help=f'GitHub repository URL to index (default: {DEFAULT_REPO})')
    parser.add_argument('--branch', default='main', help='repository branch to index')
    parser.add_argument('--register-only', action='store_true', help='register the workflows without indexing anything')
    args = parser.parse_args()

    api_config = Configuration()
    clients = OrkesClients(configuration=api_config)
    register(clients)
    if args.register_only:
        return

    # With neither source given, index both defaults
    index_all = not args.sitemap and not args.repo
    if args.sitemap or index_all:
        run(clients, 'index_site', {'sitemap_url': args.sitemap or DEFAULT_SITEMAP, 'max_pages': args.max_pages}, api_config.ui_host)
    if args.repo or index_all:
        run(clients, 'github_repo_index', {'repo_url': args.repo or DEFAULT_REPO, 'branch': args.branch}, api_config.ui_host)


if __name__ == '__main__':
    main()
