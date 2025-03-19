import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from workflow import start_workflow, stop_workflow, stop_workers
import os
from conductor.client.configuration.configuration import Configuration
from conductor.client.orkes_clients import OrkesClients
from conductor.client.http.models.task_result_status import TaskResultStatus

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Orkes server configuration
ORKES_CONDUCTOR_URL = os.getenv("CONDUCTOR_SERVER_URL")

# Get authentication keys from environment variables
CONDUCTOR_AUTH_KEY = os.getenv("CONDUCTOR_AUTH_KEY")
CONDUCTOR_AUTH_SECRET = os.getenv("CONDUCTOR_AUTH_SECRET")

# Initialize the configuration
config = Configuration()
config.server_api_url = ORKES_CONDUCTOR_URL
config.orkes_api_key = CONDUCTOR_AUTH_KEY
config.orkes_api_secret = CONDUCTOR_AUTH_SECRET

# Initialize OrkesClients
orkes_clients = OrkesClients(configuration=config)
workflow_client = orkes_clients.get_workflow_client()
task_client = orkes_clients.get_task_client()
prev_timestamp = [None]
prev_sub_workflow_id = [None]

async def poll_for_response(custom_message="Processing request...", workflow_type='WORKFLOW_ID', extract_fn=None, max_wait_time=15):
    reply_text = custom_message
    updated_workflow = workflow_client.get_workflow(workflow_id=os.environ[workflow_type])
    messages_list = updated_workflow.variables.get('messages', [])
    print(workflow_type, os.environ[workflow_type])
    
    for _ in range(max_wait_time):
        messages_list = updated_workflow.variables.get('messages', [])

        last_msg = messages_list[-1] if messages_list else "None"
        curr_timestamp = messages_list[-1].get('timestamp') if messages_list else "None"
        print("LAST MSG: " + str(last_msg))
        if prev_timestamp[0] != curr_timestamp and messages_list and messages_list[-1].get('role') == 'assistant':
            reply_text = extract_fn(messages_list) if extract_fn else messages_list[-1].get('message')
            prev_timestamp[0] = curr_timestamp
            break
        await asyncio.sleep(2)
        updated_workflow = workflow_client.get_workflow(workflow_id=os.environ[workflow_type])
    print("------------------------------------------------------------------------------------")
    
    # interview has timed out
    if reply_text == custom_message:
        raise Exception("Failed to update reply_text with a new message.")
    
    return reply_text

async def poll_for_sub_workflow_id(max_wait_time=60):
    for _ in range(max_wait_time):
        primary_workflow = workflow_client.get_workflow(workflow_id=os.environ['WORKFLOW_ID'])
        sub_workflow_id = primary_workflow.variables.get('sub_workflow_id', False)
        if sub_workflow_id != prev_sub_workflow_id[0]:
            print(f"New sub_workflow_id found: {sub_workflow_id}")
            prev_sub_workflow_id[0] = sub_workflow_id
            os.environ["SUB_WORKFLOW_ID"] = str(sub_workflow_id)
            return str(sub_workflow_id)
        await asyncio.sleep(2)
     # interview has timed out
    raise Exception("Failed to run final workers.")

async def poll_for_final_step_done(max_wait_time=60):
    for _ in range(max_wait_time):
        updated_workflow = workflow_client.get_workflow(workflow_id=os.environ['WORKFLOW_ID'])
        is_final_step_done = updated_workflow.variables.get('is_final_step_done', False)
        if is_final_step_done:
            print(f"Final step is done: {is_final_step_done}")
            return True
        await asyncio.sleep(2)
     # interview has timed out
    raise Exception("Failed to run final workers.")

@app.route('/start_workflow', methods=['POST'])
def start_workflow_endpoint():
    start_workflow()
    return jsonify({"message": "Workflow started"}), 200

@app.route('/stop_workflow', methods=['POST'])
def stop_workflow_endpoint():
    stop_workflow()
    return jsonify({"message": "Workflow stopped"}), 200

@app.route('/stop_workers', methods=['POST'])
def stop_workers_endpoint():
    stop_workers()
    return jsonify({"message": "Workers stopped"}), 200

@app.route('/get_most_recent_message', methods=['GET'])
async def get_most_recent_message():
    try:
        reply_text = await poll_for_response("The interview has timed out. Please wait for the final evaluation...")
        return jsonify({"message": reply_text}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

@app.route('/get_is_initial_step_done', methods=['GET'])
def get_is_initial_step_done():
    try:
        updated_workflow = workflow_client.get_workflow(workflow_id=os.environ['WORKFLOW_ID'])
        is_initial_step_done = updated_workflow.variables.get('is_initial_step_done', False)
        return jsonify({"message": is_initial_step_done}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

@app.route('/send_name_language', methods=['POST'])
async def send_name_language():
    try:
        data = request.get_json()
        task_client.update_task_by_ref_name(workflow_id=os.environ['WORKFLOW_ID'], task_ref_name="initial_response_ref", status=TaskResultStatus.COMPLETED, output={"response": data.get('userInput')})
        reply_text = await poll_for_response("The interview has timed out. Please wait for the final evaluation...")
        return jsonify({"message": reply_text}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

@app.route('/get_is_email_valid', methods=['GET'])
def get_is_email_valid():
    try:
        updated_workflow = workflow_client.get_workflow(workflow_id=os.environ['WORKFLOW_ID'])
        is_email_valid = updated_workflow.variables.get('is_email_valid', False)
        return jsonify({"message": is_email_valid}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

@app.route('/send_email_address', methods=['POST'])
async def send_email_address():
    try:
        data = request.get_json()
        task_client.update_task_by_ref_name(workflow_id=os.environ['WORKFLOW_ID'], task_ref_name="email_response_ref", status=TaskResultStatus.COMPLETED, output={"response": data.get('userInput')})
        reply_text = await poll_for_response("The interview has timed out. Please wait for the final evaluation...")
        return jsonify({"message": reply_text}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

@app.route('/get_sub_workflow_id', methods=['GET'])
async def get_sub_workflow_id():
    try:
        sub_workflow_id = await poll_for_sub_workflow_id()
        return jsonify({"message": str(sub_workflow_id)}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

@app.route('/get_question', methods=['GET'])
async def get_question():
    try:        
        def extract_question(messages_list):
            return [messages_list[-2].get('message'), messages_list[-1].get('message')]
        
        reply_text = await poll_for_response("The interview has timed out. Please wait for the final evaluation...", workflow_type="SUB_WORKFLOW_ID", extract_fn=extract_question)
        return jsonify({"message": reply_text}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

@app.route('/send_user_input', methods=['POST'])
async def send_user_input():
    try:
        data = request.get_json()
        task_client.update_task_by_ref_name(workflow_id=os.environ['SUB_WORKFLOW_ID'], task_ref_name="interviewee_response_ref", status=TaskResultStatus.COMPLETED, output={"response": data.get('userInput')})
        reply_text = await poll_for_response("The interview has timed out. Please wait for the final evaluation...", workflow_type="SUB_WORKFLOW_ID")
        return jsonify({"message": reply_text}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500
    
@app.route('/get_question_status', methods=['GET'])
def get_question_status():
    try:
        updated_workflow = workflow_client.get_workflow(workflow_id=os.environ['SUB_WORKFLOW_ID'])
        question_status = updated_workflow.variables.get('is_question_done', "")
        overtime_status = updated_workflow.variables.get('is_overtime', False)
        return jsonify({"message": question_status, "isOvertime": overtime_status}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500
    
@app.route('/update_messages', methods=['POST'])
async def update_messages():
    try:
        # get messages, is_overtime from subworkflow
        sub_workflow = workflow_client.get_workflow(workflow_id=os.environ['SUB_WORKFLOW_ID'])
        messages = sub_workflow.variables.get('messages', "")
        data = request.get_json()
        is_overtime = data.get('is_overtime')

        # use messages to update og-workflow
        task_client.update_task_by_ref_name(workflow_id=os.environ['WORKFLOW_ID'], task_ref_name=data.get('question'), status=TaskResultStatus.COMPLETED, output={"messages": messages, "is_overtime": is_overtime})
        return jsonify({"message": "Messages are updated"}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

@app.route('/get_is_final_step_done', methods=['GET'])
async def get_is_final_step_done():
    try:
        is_final_step_done = await poll_for_final_step_done()
        return jsonify({"message": is_final_step_done}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
    # app.run(debug=True)
    print("Server running on port", port)
