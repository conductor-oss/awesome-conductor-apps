# Agentic Workflow: Save PDF Worker with Conductor

This Conductor worker generates a PDF from HTML input using [Conductor](https://github.com/conductor-oss/conductor) and [xhtml2pdf](https://xhtml2pdf.readthedocs.io/).  
Use this worker in conjunction with the Agentic Research workflow.

---

## 🛠️ Setup and Run the Worker

Choose one of the following options to run the PDF generation worker:

### 📦 Option 1: Run with Conda (Local Python)

1. Create a Conda environment with Python:
   ```bash
   conda create --name pdfgen-env python
   ```

2. Activate the environment:

   ```bash
   conda activate pdfgen-env
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Set required environment variables:

   ```bash
   export CONDUCTOR_SERVER_URL=https://developer.orkescloud.com/api
   export CONDUCTOR_AUTH_KEY=your-key
   export CONDUCTOR_AUTH_SECRET=your-secret
   ```

5. Run the worker:

   ```bash
   python save_pdf_worker.py
   ```

---

### 🐳 Option 2: Run with Docker

1. Build the Docker image:

   ```bash
   docker build -t pdf-generator .
   ```

2. Run the container with environment variables and mount the current directory:

   ```bash
   docker run --rm \
     -v "$(pwd)":/app \
     -e CONDUCTOR_SERVER_URL=https://developer.orkescloud.com/api \
     -e CONDUCTOR_AUTH_KEY=your-key \
     -e CONDUCTOR_AUTH_SECRET=your-secret \
     pdf-generator
   ```

> 📂 Any generated PDFs will be saved to your current working directory.

---

## 💻 Source Code

**Task worker that generates PDFs from HTML input:**
[`save_pdf_worker.py`](save_pdf_worker.py)

---

## ⚙️ How It Works

* Registers a task worker (`save_pdf`) with Conductor.
* Waits for tasks containing HTML data.
* Converts the HTML to a PDF using `xhtml2pdf`.
* Saves the file locally and returns a success message.