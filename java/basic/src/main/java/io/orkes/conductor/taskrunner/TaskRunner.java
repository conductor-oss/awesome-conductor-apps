package io.orkes.conductor.taskrunner;

import com.netflix.conductor.client.automator.TaskRunnerConfigurer;
import com.netflix.conductor.client.http.ConductorClient;
import com.netflix.conductor.client.http.TaskClient;
import com.netflix.conductor.client.worker.Worker;
import com.netflix.conductor.common.metadata.tasks.Task;
import com.netflix.conductor.common.metadata.tasks.TaskResult;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import io.orkes.conductor.workers.SayHelloWorker;
import java.util.List;

public class TaskRunner {

  private static final String CONDUCTOR_SERVER = "https://play.orkes.io/api";
  private static final String KEY = "_CHANGE_ME_";
  private static final String SECRET = "_CHANGE_ME_";

  public static void main(String[] args) throws ExecutionException, InterruptedException, TimeoutException {
    var client = new ConductorClient(CONDUCTOR_SERVER);
    var taskClient = new TaskClient(client);
    var runnerConfigurer = new TaskRunnerConfigurer.Builder(taskClient, List.of(new SayHelloWorker()))
        .withThreadCount(10)
        .build();
    runnerConfigurer.init();
  }
}