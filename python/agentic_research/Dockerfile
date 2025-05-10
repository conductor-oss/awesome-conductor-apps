# Dockerfile (no changes needed for env vars)
FROM python:3.11-slim

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "save_pdf_worker.py"]
