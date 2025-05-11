# To set up and run the PDF generation worker, choose one of the following options:

# ───────────────────────────────
# 📦 Option 1: Run with Conda (Local Python)
# ───────────────────────────────
# 1. Create a Conda environment with Python:
#    conda create --name pdfgen-env python
#
# 2. Activate the environment:
#    conda activate pdfgen-env
#
# 3. Install dependencies:
#    pip install -r requirements.txt
#
# 4. Set required environment variables:
#    export CONDUCTOR_SERVER_URL=https://developer.orkescloud.com/api
#    export CONDUCTOR_AUTH_KEY=your-key
#    export CONDUCTOR_AUTH_SECRET=your-secret
#
# 5. Run the worker:
#    python save_pdf_worker.py

# ───────────────────────────────
# 🐳 Option 2: Run with Docker
# ───────────────────────────────
# 1. Build the Docker image:
#    docker build -t pdf-generator .
#
# 2. Run the container with required environment variables:
#    docker run --rm \
#      -v "$(pwd)":/app \
#      -e CONDUCTOR_SERVER_URL=https://developer.orkescloud.com/api \
#      -e CONDUCTOR_AUTH_KEY=your-key \
#      -e CONDUCTOR_AUTH_SECRET=your-secret \
#      pdf-generator

# This worker listens for Conductor tasks of type 'save_pdf' and generates PDFs from HTML content.


from conductor.client.automator.task_handler import TaskHandler
from conductor.client.configuration.configuration import Configuration
from conductor.client.worker.worker_task import worker_task
from xhtml2pdf import pisa
import os
import re

@worker_task(task_definition_name='save_pdf')
def save_pdf_task(input_data: str, filename: str):
    try:
        # Clean up the HTML content
        cleaned_html = input_data.removeprefix("```html").removesuffix("```").strip()

        # Inject styling block into the <head>
        style_block = """
        <style>
            body {
                font-family: "Times-Roman", "Times New Roman", serif;
                font-size: 12pt;
                color: #222;
                line-height: 1.6;
            }
            h1 {
                font-size: 24pt;
                font-weight: bold;
                color: #000;
                margin-bottom: 12pt;
            }
            h2 {
                font-size: 18pt;
                font-weight: bold;
                color: #333;
                margin-top: 16pt;
                margin-bottom: 8pt;
            }
            h3 {
                font-size: 14pt;
                font-weight: bold;
                color: #444;
                margin-top: 12pt;
                margin-bottom: 6pt;
            }
            p {
                margin-bottom: 10pt;
            }
            ul {
                margin-left: 20pt;
                margin-bottom: 12pt;
            }
            li {
                margin-bottom: 6pt;
            }
            strong {
                font-weight: bold;
            }
        </style>
        """

        # Inject <style> into the <head>
        if "<head>" in cleaned_html:
            styled_html = re.sub(r"<head>", "<head>" + style_block, cleaned_html, count=1)
        else:
            # If no <head>, inject full wrapper
            styled_html = f"<html><head>{style_block}</head><body>{cleaned_html}</body></html>"

        # Generate PDF
        with open(filename, "wb") as f:
            pisa_status = pisa.CreatePDF(styled_html, dest=f)

        if pisa_status.err:
            return {"error": "PDF generation failed"}
        return {"message": f"PDF saved successfully as {filename}"}

    except Exception as e:
        return {"error": str(e)}
        
# Start polling for tasks
api_config = Configuration()
task_handler = TaskHandler(configuration=api_config)
task_handler.start_processes()
