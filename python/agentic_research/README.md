# Agentic Workflow: Save PDF Worker with Conductor

This Conductor worker generates a PDF from HTML input using [Conductor](https://github.com/conductor-oss/conductor) and [xhtml2pdf](https://xhtml2pdf.readthedocs.io/).  
Use this worker in conjunction with the Agentic Research workflow.

---

## 🛠️ Setup and Run the Worker

All commands below run from the `workers/` directory:

```bash
cd workers
```

Choose one of the following options to run the PDF generation worker:

### 📦 Option 1: Run with Conda (Local Python)

1. Create a Conda environment with Python 3.10 or newer (tested with 3.14):

   ```bash
   conda create --name pdfgen-env python=3.14
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

The image is based on `python:3.14-slim`.

1. Make sure the Docker engine is running. On macOS and Windows, start Docker Desktop. Then check that the CLI can reach it:

   ```bash
   docker info
   ```

2. Build the image from the `workers/` directory. The trailing `.` is the build context and must be the folder that contains the `Dockerfile`:

   ```bash
   docker build -t pdf-generator .
   ```

3. Run the container with environment variables and mount the current directory:

   ```bash
   docker run --rm \
     -v "$(pwd)":/app \
     -e CONDUCTOR_SERVER_URL=https://developer.orkescloud.com/api \
     -e CONDUCTOR_AUTH_KEY=your-key \
     -e CONDUCTOR_AUTH_SECRET=your-secret \
     pdf-generator
   ```

> 📂 Any generated PDFs will be saved to your current working directory.

To use a Conductor server running on your own machine (for example one started with `conductor server start`), set `CONDUCTOR_SERVER_URL=http://host.docker.internal:8080/api`. Inside the container, `localhost` refers to the container itself. A local OSS server needs no auth key or secret.

#### Troubleshooting

| Error | Fix |
| --- | --- |
| `'docker build' requires 1 argument` | Add the build context: `docker build -t pdf-generator .` |
| `failed to read dockerfile: open Dockerfile: no such file or directory` | Run the build from `workers/`, where the `Dockerfile` is. |
| `failed to connect to the docker API at unix:///var/run/docker.sock` | The Docker engine isn't running. Start Docker Desktop, wait for it to finish starting, and run `docker info` again. If it still fails, run `docker context ls` and switch to Docker Desktop's context with `docker context use desktop-linux`. |
| `DEPRECATED: The legacy builder is deprecated` | Only a warning; the build still works. Docker Desktop includes BuildKit. With a standalone Docker CLI, install the `buildx` plugin (`brew install docker-buildx` on macOS). |

---

## 💻 Source Code

**Task worker that generates PDFs from HTML input:**
[`workers/save_pdf_worker.py`](workers/save_pdf_worker.py)

---

## ⚙️ How It Works

* Registers a task worker (`save_pdf`) with Conductor.
* Waits for tasks containing HTML data.
* Converts the HTML to a PDF using `xhtml2pdf`.
* Saves the file locally and returns a success message.
