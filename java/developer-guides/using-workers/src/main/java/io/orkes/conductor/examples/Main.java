package io.orkes.conductor.examples;

import com.netflix.conductor.client.automator.TaskRunnerConfigurer;
import com.netflix.conductor.client.http.TaskClient;
import io.orkes.conductor.client.ApiClient;
import io.orkes.conductor.examples.workers.GreetWorker;
import java.util.List;

public class Main {

    public static void main(String[] args) {
        var client = ApiClient.builder()
                .basePath("https://your-cluster/api")
                .credentials("_CHANGE_ME_", "_CHANGE_ME_")
                .build();

        TaskClient taskClient = new TaskClient(client);
        TaskRunnerConfigurer configurer = new TaskRunnerConfigurer.Builder(
                taskClient,
                List.of(new GreetWorker())
        ).withThreadCount(10).build();
        configurer.init();
    }
}
