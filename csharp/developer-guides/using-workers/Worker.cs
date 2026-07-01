using Conductor.Client.Authentication;
using Conductor.Client.Worker;
using Conductor.Client.Models;
using Conductor.Client.Extensions;
using Conductor.Client;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace example
{
    [WorkerTask]
    public class MyWorker
    {
        [WorkerTask(taskType: "myTask", batchSize: 5, pollIntervalMs: 500, workerId: "sample-csharp-worker")]
        public static TaskResult MyTask(Conductor.Client.Models.Task task)
        {
            var inputData = task.InputData;
            var result = task.ToTaskResult();
            result.OutputData = new Dictionary<string, object>
            {
                ["greeting"] = "Hello, " + inputData.GetValueOrDefault("name", null)
            };
            return result;
        }

        public static void Main(string[] args)
        {
            var conf = new Configuration
            {
                BasePath = "https://your-cluster.orkesconductor.io/api",
                AuthenticationSettings = new OrkesAuthenticationSettings("_CHANGE_ME_", "_CHANGE_ME_")
            };

            var host = WorkflowTaskHost.CreateWorkerHost(
                conf,
                LogLevel.Debug
            );
            host.Start();

            Console.WriteLine("Press Ctrl+C to exit.");
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
