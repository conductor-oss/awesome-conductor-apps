package io.orkes.conductor.examples;

import com.netflix.conductor.common.run.Workflow;
import com.netflix.conductor.sdk.workflow.def.ConductorWorkflow;
import com.netflix.conductor.sdk.workflow.def.WorkflowBuilder;
import com.netflix.conductor.sdk.workflow.def.tasks.Http;
import com.netflix.conductor.sdk.workflow.def.tasks.SimpleTask;
import com.netflix.conductor.sdk.workflow.def.tasks.Switch;
import com.netflix.conductor.sdk.workflow.executor.WorkflowExecutor;
import io.orkes.conductor.client.ApiClient;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public class WorkflowAsCode {

    public static void main(String[] args) {
        // Set up an application in your Orkes Conductor cluster. Sign up for a Developer Edition account at https://developer.orkescloud.com.
        // - Set your cluster's API URL as basePath (e.g., "https://developer.orkescloud.com/api" for Developer Edition).
        // - Use the application's Key ID and Secret here.
        ApiClient client = ApiClient.builder()
                .basePath("_CHANGE_ME_")
                .credentials("_CHANGE_ME_", "_CHANGE_ME_")
                .build();

        // A WorkflowExecutor instance is used to register and execute workflows.
        int pollingInterval = 50;
        WorkflowExecutor executor = new WorkflowExecutor(client, pollingInterval);

        // Create the workflow definition.
        ConductorWorkflow<Object> workflow = new WorkflowBuilder<>(executor)
                .name("helloWorld")
                .version(1)
                .description("Hello World workflow that greets a user. Uses a Switch task, HTTP task, and Simple task.")
                .add(new Http("get-user_ref").url("https://randomuser.me/api/"))
                // This switch task will execute the "myTask" task if the user's country is "United States"
                .add(new Switch("user-criteria_ref", "${get-user_ref.output.response.body.results[0].location.country}")
                        .switchCase("United States", new SimpleTask("myTask", "myTask_ref")
                                .input("name", "${get-user_ref.output.response.body.results[0].name.first}")))
                .build();

        // Register the workflow with overwrite = true and registerTasks = true.
        workflow.registerWorkflow(true, true);

        // Start the workflow
        String id = executor.startWorkflow(workflow.getName(), workflow.getVersion(), Map.of());
        System.out.printf("Started workflow %s%n", id);
        // Alternatively, call execute which will return once the workflow reaches a terminal state
        // (COMPLETED, FAILED or TERMINATED)
        // syncExecution(workflow);

        executor.shutdown();
    }

    private static void syncExecution(ConductorWorkflow<Object> workflow) throws ExecutionException, InterruptedException, TimeoutException {
        CompletableFuture<Workflow> execution = workflow.execute(Map.of());
        Workflow workflowExecution = execution.get(1, TimeUnit.MINUTES);
        Workflow.WorkflowStatus status = workflowExecution.getStatus();
        System.out.printf("Workflow: %s, status: %s%n", workflowExecution.getWorkflowId(), status);
    }

}
