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
      var conf = new Configuration
      {
        BasePath = "https://developer.orkescloud.com/api",
        AuthenticationSettings = new OrkesAuthenticationSettings("_CHANGE_ME_", "_CHANGE_ME_")
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