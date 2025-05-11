# Dockerfile for Agentic PDF Worker
FROM python:3.11-slim

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# The worker will use environment variables passed at runtime for credentials and server URL
CMD ["python", "save_pdf_worker.py"]
