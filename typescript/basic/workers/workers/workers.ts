import {
  ConductorWorker,
  Task,
  TaskResult,
} from "@io-orkes/conductor-javascript";

export const sayHello: ConductorWorker = {
  taskDefName: "sayHello",
  execute: async (
    task: Task
  ): Promise<Omit<TaskResult, "workflowInstanceId" | "taskId">> => {
    const taskId = task.taskId || "";

    if (!task.inputData?.firstName || !task.inputData?.lastName) {
      return {
        status: "FAILED",
        outputData: { error: "First name and last name are required" },
        logs: [
          {
            log: "Missing required first name and last name in input",
            createdTime: Date.now(),
            taskId,
          },
        ],
      };
    }

    const firstName = task.inputData.firstName as string;
    const lastName = task.inputData.lastName as string;

    const sayHello = (name: string, lastName: string) => {
      return `Hello from Conductor, ${name} ${lastName}`;
    };

    return {
      status: "COMPLETED",
      outputData: {
        message: sayHello(firstName, lastName),
      },
      logs: [
        {
          log: `Said hello to ${firstName} ${lastName}`,
          createdTime: Date.now(),
          taskId,
        },
      ],
    };
  },
};
