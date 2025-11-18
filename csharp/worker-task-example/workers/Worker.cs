using Conductor.Client.Authentication;
using Conductor.Client.Worker;
using Conductor.Client.Models;
using Conductor.Client.Extensions;
using Conductor.Client;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BasicExample
{
  [WorkerTask]
  public class SayHelloWorker
  {
    [WorkerTask(taskType: "sayHello", batchSize: 1, pollIntervalMs: 100)]
    public static TaskResult SayHello(Conductor.Client.Models.Task task)
    {
      var firstName = task.InputData["firstName"].ToString();
      var lastName = task.InputData["lastName"].ToString();

      var result = task.ToTaskResult();
      result.OutputData = new Dictionary<string, object>
      {
        ["result"] = $"Hello, {firstName} {lastName}"
      };
      return result;
    }

    public static void Main(string[] args)
    {
      var serverUrl = Environment.GetEnvironmentVariable("CONDUCTOR_SERVER_URL") ?? "https://developer.orkescloud.com/api";
      var authKey = Environment.GetEnvironmentVariable("CONDUCTOR_AUTH_KEY") ?? "";
      var authSecret = Environment.GetEnvironmentVariable("CONDUCTOR_AUTH_SECRET") ?? "";

      var conf = new Configuration
      {
        BasePath = serverUrl,
        AuthenticationSettings = new OrkesAuthenticationSettings(authKey, authSecret)
      };

      var host = WorkflowTaskHost.CreateWorkerHost(
          conf,
          LogLevel.Debug
      );
      host.Start();

      Console.WriteLine("Worker started. Press Ctrl+C to exit.");
      var evt = new ManualResetEvent(false);
      Console.CancelKeyPress += (sender, e) =>
      {
        e.Cancel = true;
        Console.WriteLine("Ctrl+C pressed. Shutting down...");
        evt.Set();
      };

      evt.WaitOne();
      host.StopAsync();
    }
  }
}