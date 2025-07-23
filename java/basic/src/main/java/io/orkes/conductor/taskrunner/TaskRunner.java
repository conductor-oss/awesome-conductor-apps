package io.orkes.conductor.taskrunner;

import com.netflix.conductor.client.automator.TaskRunnerConfigurer;
import com.netflix.conductor.client.http.TaskClient;
import com.netflix.conductor.client.worker.Worker;
import com.netflix.conductor.common.metadata.tasks.Task;
import com.netflix.conductor.common.metadata.tasks.TaskResult;
import io.github.cdimascio.dotenv.Dotenv;
import io.orkes.conductor.client.ApiClient;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import io.orkes.conductor.workers.SayHelloWorker;
import java.util.List;

public class TaskRunner {

  public static void main(String[] args) throws ExecutionException, InterruptedException, TimeoutException {
    Dotenv dotenv = Dotenv.configure()
        .filename(".env.local")
        .load();

    var apiClient = new ApiClient(
        dotenv.get("ORKES_API_URL"),
        dotenv.get("ORKES_API_KEY_ID"),
        dotenv.get("ORKES_API_KEY_SECRET"));
    var taskClient = new TaskClient(apiClient);
    var runnerConfigurer = new TaskRunnerConfigurer.Builder(taskClient, List.of(new SayHelloWorker()))
        .withThreadCount(10)
        .build();
    runnerConfigurer.init();
  }
}