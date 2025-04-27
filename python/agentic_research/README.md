# Agentic Workflow: Save PDF Worker with Conductor

Automated agent workflow that generates a PDF from HTML input using [Conductor](https://github.com/conductor-oss/conductor) and [WeasyPrint](https://weasyprint.org/).
Use this worker in conjunction with the Agentic Research workflow.

---

## Install requirements
```shell
# Create and activate a new Conda environment
conda create --name myenv python
conda activate myenv

# Install required packages
pip install conductor-python weasyprint
```

---

## Set up Conductor account and credentials
1. Login to [Orkes Developer Console](https://developer.orkescloud.com/).
2. Go to [Applications](https://developer.orkescloud.com/applicationManagement/applications).
3. Create a new application to get your API key and secret.

Set your environment variables:
```shell
export CONDUCTOR_SERVER_URL=https://developer.orkescloud.com/api;
export CONDUCTOR_AUTH_KEY=<<YOUR_CONDUCTOR_AUTH_KEY>>
export CONDUCTOR_AUTH_SECRET=<<YOUR_CONDUCTOR_AUTH_SECRET>>
```

(Replace `<<YOUR_CONDUCTOR_AUTH_KEY>>` and `<<YOUR_CONDUCTOR_AUTH_SECRET>>` with your own credentials.)

---

## Run the worker
```shell
python save_pdf_worker.py
```

---

## Source code

**Task worker that generates PDFs from HTML input:**  
[save_pdf_worker.py](save_pdf_worker.py)

---

## How it works
- Registers a task worker (`save_pdf`) with Conductor.
- Waits for incoming tasks containing HTML data.
- Converts the HTML to a PDF file using WeasyPrint.
- Saves the file locally and returns a success message.
