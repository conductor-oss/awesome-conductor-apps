import json
from conductor.client.worker.worker_task import worker_task
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account
import io

from datetime import datetime

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/documents"]

def get_credentials():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # dev vs prod interaction w/ Google API
            if os.getenv('ENV') == 'deployed':
                # In deploy, use the service account JSON from the env var, requires extra procesing
                service_account_info = json.loads(json.loads(os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')))
                creds = service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=SCOPES)
            elif os.getenv('ENV') == 'prod':
                # In prod, use the service account JSON from the env var
                service_account_info = json.loads(os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON'))
                creds = service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=SCOPES)
            else:
                # In local/prod, use your own credentials JSON
                flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
                creds = flow.run_local_server(port=0)
                with open("token.json", "w") as token:
                    token.write(creds.to_json())
    return creds

def upload_text_to_drive_as_doc(text, filename, creds, email):
    try:
        service = build("drive", "v3", credentials=creds)
        file_metadata = {
            "name": filename,
            "mimeType": "application/vnd.google-apps.document"  # Google Docs format
        }
        media = MediaIoBaseUpload(io.BytesIO(text.encode()), mimetype="text/plain")
        file = service.files().create(body=file_metadata, media_body=media, fields="id").execute()
        print(f"Google Doc uploaded successfully. File ID: {file.get('id')}")
        print("#" * 50)
        print(f"Transcript File URL: https://docs.google.com/document/d/{file.get('id')}")
        print("#" * 50)

        # Share the file with interviewer
        permission = {
            "type": "user",
            "role": "writer",  # Can be 'reader', 'commenter', or 'writer'
            "emailAddress": os.getenv('SEND_GRID_EMAIL_ADDRESS')
        }
        service.permissions().create(
            fileId=file.get('id'),
            body=permission,
            fields="id"
        ).execute()
        print(f"File shared with {os.getenv('SEND_GRID_EMAIL_ADDRESS')}")

         # Share the file with interviewee
        permission = {
            "type": "user",
            "role": "reader",  # Can be 'reader', 'commenter', or 'writer'
            "emailAddress": email
        }
        service.permissions().create(
            fileId=file.get('id'),
            body=permission,
            fields="id"
        ).execute()
        print(f"File shared with interviewee at {email}")

        return file.get('id')
    except Exception as error:
        print(f"An error occurred: {error}")
        return None

def apply_google_docs_formatting(doc_id, formatted_text, creds):
    try:
        service = build("docs", "v1", credentials=creds)

        requests = []

        # Apply formatting to each part of the transcript
        start_index = 1
        for entry in formatted_text:
            # Add the role header in bold
            role_header_start = start_index
            role_header_end = role_header_start + len("ROLE: ")
            requests.append({
                "insertText": {
                    "location": {"index": start_index},
                    "text": "ROLE: "
                }
            })
            requests.append({
                "updateTextStyle": {
                    "range": {"startIndex": role_header_start, "endIndex": role_header_end},
                    "textStyle": {"bold": True},
                    "fields": "bold"
                }
            })
            start_index = role_header_end

            # Add the role content (plain text, non-bold)
            role_content_start = start_index
            role_content_end = role_content_start + len(entry['role'])
            requests.append({
                "insertText": {
                    "location": {"index": start_index},
                    "text": entry['role'] + "\n"
                }
            })
            requests.append({
                "updateTextStyle": {
                    "range": {"startIndex": role_content_start, "endIndex": role_content_end},
                    "textStyle": {"bold": False},
                    "fields": "bold"
                }
            })
            start_index = role_content_end + 1

            # Add the timestamp header in bold
            timestamp_header_start = start_index
            timestamp_header_end = timestamp_header_start + len("TIMESTAMP: ")
            requests.append({
                "insertText": {
                    "location": {"index": start_index},
                    "text": "TIMESTAMP: "
                }
            })
            requests.append({
                "updateTextStyle": {
                    "range": {"startIndex": timestamp_header_start, "endIndex": timestamp_header_end},
                    "textStyle": {"bold": True},
                    "fields": "bold"
                }
            })
            start_index = timestamp_header_end

            # Add the timestamp content (plain text, non-bold)
            timestamp_content_start = start_index
            timestamp_content_end = timestamp_content_start + len(entry['timestamp'])
            requests.append({
                "insertText": {
                    "location": {"index": start_index},
                    "text": entry['timestamp'] + "\n"
                }
            })
            requests.append({
                "updateTextStyle": {
                    "range": {"startIndex": timestamp_content_start, "endIndex": timestamp_content_end},
                    "textStyle": {"bold": False},
                    "fields": "bold"
                }
            })
            start_index = timestamp_content_end + 1

            # Add the message header in bold
            message_header_start = start_index
            message_header_end = message_header_start + len("MESSAGE: ")
            requests.append({
                "insertText": {
                    "location": {"index": start_index},
                    "text": "MESSAGE: "
                }
            })
            requests.append({
                "updateTextStyle": {
                    "range": {"startIndex": message_header_start, "endIndex": message_header_end},
                    "textStyle": {"bold": True},
                    "fields": "bold"
                }
            })
            start_index = message_header_end

            # Add the message content (plain text, non-bold)
            message_content_start = start_index
            message_content_end = message_content_start + len(entry['message'])
            requests.append({
                "insertText": {
                    "location": {"index": start_index},
                    "text": entry['message'] + "\n"
                }
            })
            requests.append({
                "updateTextStyle": {
                    "range": {"startIndex": message_content_start, "endIndex": message_content_end},
                    "textStyle": {"bold": False},
                    "fields": "bold"
                }
            })
            start_index = message_content_end + 1

            # Add a separator line
            separator_start = start_index
            separator_end = separator_start + len('-' * 80)
            requests.append({
                "insertText": {
                    "location": {"index": start_index},
                    "text": '-' * 80 + "\n"
                }
            })
            start_index = separator_end + 1

        # Execute the batch update
        service.documents().batchUpdate(
            documentId=doc_id, body={"requests": requests}
        ).execute()
        print("Formatting applied successfully.")
    except HttpError as error:
        print(f"An error occurred: {error}")


@worker_task(task_definition_name='storeInterviewTranscript')
def storeInterviewTranscript(messages: str, name: str, email: str):
    formatted_text = []

    # Iterate over the input data and prepare it for formatting
    for entry in messages:
        try:
            role = entry['role']
            timestamp = entry['timestamp']
            message = entry['message']
        except KeyError as e:
            return f"Missing expected field: {e}"

        formatted_text.append({
            'role': role,
            'timestamp': timestamp,
            'message': message
        })

    # Upload raw text to Google Drive (to create the document)
    current_date = datetime.today().strftime('%m/%d/%Y')
    transcript_title = f'Interview Transcript for {name}: {current_date}'
    creds = get_credentials()
    doc_id = upload_text_to_drive_as_doc("", transcript_title, creds, email)

    if doc_id:
        # Now apply formatting to the document
        apply_google_docs_formatting(doc_id, formatted_text, creds)

    return f'https://docs.google.com/document/d/{doc_id}' if doc_id else "Failed to create document"