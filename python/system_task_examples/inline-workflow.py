from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.workflow.task.inline import InlineTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask
from conductor.client.workflow.task.http_task import HttpTask

def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) HTTP task to fetch random number from random.org
    fetch_random_number_task = HttpTask(
        task_ref_name="fetch_random_number",  # Reference name for the task
        http_input={
            "uri": "https://www.random.org/integers/?num=1&min=1&max=100&col=1&base=10&format=plain&rnd=new",  # URL for random number
            "method": "GET",  # HTTP GET method to fetch the random number
            "headers": {
                "Content-Type": "application/json"
            }
        }
    )

    # 2) Set variable for loyalty discount
    set_base_price = SetVariableTask(
        task_ref_name='set_base_price'
    )
    set_base_price.input_parameters.update({
        'base_price': '${fetch_random_number.output.response.body}'
    })

    # 3) Define the Inline task for dynamic price calculation
    calculate_price_task = InlineTask(
        task_ref_name='calculate_final_price',
        script='''
            (function() {
                let basePrice = $.base_price;
                let loyaltyDiscount = $.loyalty_discount === "gold" ? 0.2 : 0;
                let promotionDiscount = $.promotion_discount ? 0.1 : 0;
                return basePrice * (1 - loyaltyDiscount - promotionDiscount);
            })();
        ''',
        bindings={
            'base_price': '${workflow.variables.base_price}',
            'loyalty_discount': '${workflow.input.loyalty_status}',
            'promotion_discount': '${workflow.input.is_promotion_active}',
        }
    )

    # 4) Optionally set the final calculated price in a variable
    set_price_variable = SetVariableTask(
        task_ref_name='set_final_price_variable'
    )
    set_price_variable.input_parameters.update({
        'final_price': '${calculate_final_price.output.result}'
    })

    # Define the workflow and add tasks
    workflow = ConductorWorkflow(
        name='dynamic_pricing_workflow',
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.add(fetch_random_number_task)
    workflow.add(set_base_price)
    workflow.add(calculate_price_task)
    workflow.add(set_price_variable)

    # Register the workflow
    workflow.register(overwrite=True)
    return workflow

def main():
    api_config = Configuration()
    workflow_executor = WorkflowExecutor(configuration=api_config)

    # Register the workflow
    workflow = register_workflow(workflow_executor)

    # Start the worker polling mechanism (if needed)
    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

    # Example input
    workflow_input = {
        'loyalty_status': 'gold',
        'is_promotion_active': True
    }

    # Start workflow execution
    workflow_run = workflow_executor.execute(
        name=workflow.name,
        version=workflow.version,
        workflow_input=workflow_input
    )

    print(f"Started workflow ID: {workflow_run.workflow_id}")
    print(f"View in UI: {api_config.ui_host}/execution/{workflow_run.workflow_id}")

    task_handler.stop_processes()


if __name__ == '__main__':
    main()
