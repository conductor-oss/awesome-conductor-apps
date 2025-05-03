from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask
from conductor.client.workflow.task.inline import InlineTask
from conductor.client.workflow.task.timeout_policy import TimeoutPolicy


def register_hotel_booking_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) HTTP task to reserve a hotel (simulated with dummy URL)
    reserve_hotel_task = HttpTask(
        task_ref_name="reserve_hotel",
        http_input={
            "uri": "https://httpbin.org/post",
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "body": {
                "hotel_id": "${workflow.input.hotel_id}",
                "checkin": "${workflow.input.checkin_date}",
                "checkout": "${workflow.input.checkout_date}",
                "customer_id": "${workflow.input.customer_id}"
            }
        }
    )

    # 2) Set variable to confirm reservation status (simulate from body)
    set_status = SetVariableTask(task_ref_name='set_reservation_status')
    set_status.input_parameters.update({
        'reservation_status': '${reserve_hotel.output.response.body.json.status}'
    })

    # 3) Inline task to check booking status
    evaluate_reservation = InlineTask(
        task_ref_name='check_booking_status',
        script='''
            (function() {
                if ($.reservation_status !== 'confirmed') {
                    throw new Error("Booking failed");
                }
                return "confirmed";
            })();
        ''',
        bindings={
            'reservation_status': '${workflow.variables.reservation_status}'
        }
    )

    workflow = ConductorWorkflow(
        name='hotel_booking_workflow',
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.description = "Hotel reservation flow with SLA and failure handling"
    workflow.timeout_seconds(900)  # 15 minutes
    workflow.timeout_policy(TimeoutPolicy.TIME_OUT_WORKFLOW)
    workflow.failure_workflow("hotel_booking_failure_handler")

    workflow.add(reserve_hotel_task)
    workflow.add(set_status)
    workflow.add(evaluate_reservation)

    workflow.register(overwrite=True)
    return workflow


def register_failure_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # Notify customer (simulated with dummy URL)
    notify_customer_task = HttpTask(
        task_ref_name="notify_customer",
        http_input={
            "uri": "https://httpbin.org/post",
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "body": {
                "customer_id": "${workflow.input.customer_id}",
                "message": "Your hotel booking could not be completed. We apologize for the inconvenience."
            }
        }
    )

    # Trigger refund (simulated with dummy URL)
    refund_payment_task = HttpTask(
        task_ref_name="trigger_refund",
        http_input={
            "uri": "https://httpbin.org/post",
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "body": {
                "payment_id": "${workflow.input.payment_id}",
                "reason": "Hotel booking failed"
            }
        }
    )

    failure_workflow = ConductorWorkflow(
        name="hotel_booking_failure_handler",
        executor=workflow_executor
    )
    failure_workflow.version = 1
    failure_workflow.description = "Handles failed hotel bookings with customer notification and refund"

    failure_workflow.add(notify_customer_task)
    failure_workflow.add(refund_payment_task)

    failure_workflow.register(overwrite=True)
    return failure_workflow


def main():
    api_config = Configuration()
    workflow_executor = WorkflowExecutor(configuration=api_config)

    # Register both workflows
    register_hotel_booking_workflow(workflow_executor)
    register_failure_workflow(workflow_executor)

    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

    # Example input
    workflow_input = {
        "hotel_id": "HTL123",
        "checkin_date": "2025-05-01",
        "checkout_date": "2025-05-05",
        "customer_id": "CUST789",
        "payment_id": "PMT456"
    }

    workflow_run = workflow_executor.execute(
        name="hotel_booking_workflow",
        version=1,
        workflow_input=workflow_input
    )

    print(f"Started hotel booking workflow ID: {workflow_run.workflow_id}")
    print(f"View in UI: {api_config.ui_host}/execution/{workflow_run.workflow_id}")

    task_handler.stop_processes()


if __name__ == '__main__':
    main()
