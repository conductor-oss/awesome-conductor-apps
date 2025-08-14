package io.orkes.conductor.workers;

import com.netflix.conductor.client.automator.TaskRunnerConfigurer;
import com.netflix.conductor.client.http.ConductorClient;
import com.netflix.conductor.client.http.TaskClient;
import com.netflix.conductor.client.worker.Worker;
import com.netflix.conductor.common.metadata.tasks.Task;
import com.netflix.conductor.common.metadata.tasks.TaskResult;
import com.netflix.conductor.sdk.workflow.task.InputParam;
import com.netflix.conductor.sdk.workflow.task.WorkerTask;

public class SayHelloWorker implements Worker {

    @WorkerTask("sayHello")
    public String sayHello(@InputParam("name") String name) {
        return "Hello " + name;
    }

    @Override
    public String getTaskDefName() {
        return "sayHello";
    }

    @Override
    public TaskResult execute(Task task) {
        String name = (String) task.getInputData().get("name");
        String result = sayHello(name);

        TaskResult taskResult = new TaskResult(task);
        taskResult.getOutputData().put("result", result);
        taskResult.setStatus(TaskResult.Status.COMPLETED);
        return taskResult;
    }
}