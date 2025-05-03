from conductor.client.configuration.configuration import Configuration
from conductor.client.workflow.executor.workflow_executor import WorkflowExecutor
from conductor.client.workflow.conductor_workflow import ConductorWorkflow
from conductor.client.automator.task_handler import TaskHandler
from conductor.client.workflow.task.inline import InlineTask
from conductor.client.workflow.task.set_variable_task import SetVariableTask
from conductor.client.workflow.task.http_task import HttpTask
from conductor.client.workflow.task.timeout_policy import TimeoutPolicy


def register_workflow(workflow_executor: WorkflowExecutor) -> ConductorWorkflow:
    # 1) HTTP task to fetch product price (simulated with dummy URL)
    fetch_random_number_task = HttpTask(
        task_ref_name="fetch_random_number",
        http_input={
            "uri": "https://www.random.org/integers/?num=1&min=1&max=100&col=1&base=10&format=plain&rnd=new",
            "method": "GET",
            "headers": {
                "Content-Type": "application/json"
            }
        }
    )

    # 2) Set variable for base price
    set_base_price = SetVariableTask(task_ref_name='set_base_price')
    set_base_price.input_parameters.update({
        'base_price': '${fetch_random_number.output.response.body}'
    })

    # 3) Inline task to calculate final price
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

    # 4) Set final calculated price
    set_price_variable = SetVariableTask(task_ref_name='set_final_price_variable')
    set_price_variable.input_parameters.update({
        'final_price': '${calculate_final_price.output.result}'
    })

    # Define the workflow with a 30-minute timeout
    workflow = ConductorWorkflow(
        name='checkout_workflow',
        executor=workflow_executor
    )
    workflow.version = 1
    workflow.description = "E-commerce checkout workflow with 30-min timeout"
    workflow.timeout_seconds(1800)  # 30 minutes
    workflow.timeout_policy(TimeoutPolicy.TIME_OUT_WORKFLOW)

    workflow.add(fetch_random_number_task)
    workflow.add(set_base_price)
    workflow.add(calculate_price_task)
    workflow.add(set_price_variable)

    # Register the workflow definition
    workflow.register(overwrite=True)
    return workflow

def main():
    api_config = Configuration()
    workflow_executor = WorkflowExecutor(configuration=api_config)

    # Register workflow
    workflow = register_workflow(workflow_executor)

    # Start task polling
    task_handler = TaskHandler(configuration=api_config)
    task_handler.start_processes()

    # Sample input
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
