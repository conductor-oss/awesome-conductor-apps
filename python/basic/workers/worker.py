from conductor.client.worker.worker_task import worker_task

@worker_task(task_definition_name='sayHello')
def worker(firstName: str, lastName: str) -> str:
    return f'Hello, {firstName} {lastName}'

