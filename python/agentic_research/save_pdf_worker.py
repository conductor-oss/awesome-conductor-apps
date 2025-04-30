# To set up the project, install the dependencies, and run the application, follow these steps:
#
# 1. Create a Conda environment with the latest version of Python:
#    conda create --name myenv python
#
# 2. Activate the environment:
#    conda activate myenv
#
# 3. Install the necessary dependencies:
#    pip install conductor-python
#
# 4. Run the Python script:
#    python save_pdf_worker.py

from conductor.client.automator.task_handler import TaskHandler
from conductor.client.configuration.configuration import Configuration
from conductor.client.worker.worker_task import worker_task
from weasyprint import HTML
import os

@worker_task(task_definition_name='save_pdf')
def save_pdf_task(input_data: str, filename: str):
    """
    Generates a PDF from a given HTML string and saves it to a file using WeasyPrint.
    """
    try:
        HTML(string=input_data, base_url='.').write_pdf(filename)
        return {"message": f"PDF saved successfully as {filename}"}
    except Exception as e:
        return {"error": str(e)}

# Start polling for tasks
api_config = Configuration()
task_handler = TaskHandler(configuration=api_config)
task_handler.start_processes()
