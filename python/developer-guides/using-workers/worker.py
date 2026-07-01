from conductor.client.worker.worker_task import worker_task

@worker_task(task_definition_name='myTask')
def worker(name: str) -> dict:
    return {'greeting': f'Hello, {name}'}

