from conductor.client.automator.task_handler import TaskHandler
from conductor.client.configuration.configuration import Configuration
from conductor.client.configuration.settings.authentication_settings import AuthenticationSettings
from worker import *
from dotenv import load_dotenv
import os

load_dotenv('.env.local')

def main():
    configuration = Configuration(base_url=os.getenv('ORKES_API_URL'),
                                  authentication_settings=AuthenticationSettings(key_id=os.getenv('ORKES_API_KEY_ID'),
                                                                                 key_secret=os.getenv('ORKES_API_KEY_SECRET')))

    task_handler = TaskHandler(
        configuration=configuration,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()


if __name__ == '__main__':
    main()