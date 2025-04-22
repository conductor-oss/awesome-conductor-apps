from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.workflow.task.simple_task import SimpleTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.worker.worker_task import worker_task


def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) Calculate subtotal
    calc_subtotal = SimpleTask(
        task_def_name="calculate_subtotal",
        task_reference_name="calculate_subtotal"
    )

    # 2) Store subtotal
    set_subtotal = SetVariableTask(task_ref_name="set_subtotal")
    set_subtotal.input_parameters.update({
        "subtotal": "${calculate_subtotal.output.subtotal}"
    })

    # 3) Apply discount
    apply_discount = SimpleTask(
        task_def_name="apply_discount",
        task_reference_name="apply_discount"
    )

    # 4) Store discounted price
    set_discounted_price = SetVariableTask(task_ref_name="set_discounted_price")
    set_discounted_price.input_parameters.update({
        "discounted_price": "${apply_discount.output.discounted_total}"
    })

    # 5) Process payment
    process_payment = SimpleTask(
        task_def_name="process_payment",
        task_reference_name="process_payment"
    )
    process_payment.input_parameters.update({
        "amount": '${workflow.variables.discounted_price}'
    })


    # Define and register the workflow
    workflow = ConductorWorkflow(
        name="ecommerce_order_processing",
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(calc_subtotal)
    workflow.add(set_subtotal)
    workflow.add(apply_discount)
    workflow.add(set_discounted_price)
    workflow.add(process_payment)
    workflow.register(overwrite=True)

    return workflow


@worker_task(task_definition_name="calculate_subtotal")
def calculate_subtotal() -> dict:
    print("🧮 Calculating subtotal...")
    return {"subtotal": 200.0}


@worker_task(task_definition_name="apply_discount")
def apply_discount() -> dict:
    print("🏷️ Applying discount...")
    return {"discounted_total": 180.0}


@worker_task(task_definition_name="process_payment")
def process_payment(amount) -> dict:
    print(f"💰 Charging customer: {amount.input_data['amount']}")
    return {"status": "Payment successful"}


def main():
    config = Configuration()
    executor = WorkflowExecutor(configuration=config)

    # Register the workflow
    workflow = register_workflow(executor)

    # Start workers
    task_handler = TaskHandler(
        workers=[],
        configuration=config,
        scan_for_annotated_workers=True
    )
    task_handler.start_processes()

    # Start workflow execution
    print("🚀 Starting workflow...")
    workflow_run = executor.execute(
        name=workflow.name,
        version=workflow.version,
        workflow_input={}
    )

    print(f"✅ Workflow started with ID: {workflow_run.workflow_id}")
    print(f"🔗 View in UI: {config.ui_host}/execution/{workflow_run.workflow_id}")

    task_handler.stop_processes()


if __name__ == "__main__":
    main()
