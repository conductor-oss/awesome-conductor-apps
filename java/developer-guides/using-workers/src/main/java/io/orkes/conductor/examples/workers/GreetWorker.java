package io.orkes.conductor.examples.workers;

import com.netflix.conductor.client.worker.Worker;
import com.netflix.conductor.common.metadata.tasks.Task;
import com.netflix.conductor.common.metadata.tasks.TaskResult;

public class GreetWorker implements Worker {

    @Override
    public String getTaskDefName() {
        return "myTask";
    }

    @Override
    public TaskResult execute(Task task) {
        String name = (String) task.getInputData().get("name");
        TaskResult result = new TaskResult(task);
        result.setStatus(TaskResult.Status.COMPLETED);
        result.addOutputData("greeting", "Hello, " + name + "!");
        return result;
    }
}
