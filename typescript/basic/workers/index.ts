import {
  OrkesApiConfig,
  orkesConductorClient,
  ConductorClient,
  TaskManager,
} from "@io-orkes/conductor-javascript";
import { config } from "dotenv";
import { resolve } from "path";

const envPath = resolve(__dirname, "..", ".env.local");

config({ path: envPath });

import { sayHello } from "./workers/workers";

export function createTaskRunner(conductorClient: ConductorClient) {
  const taskRunner = new TaskManager(conductorClient, [sayHello], {
    logger: console,
    options: { pollInterval: 100, concurrency: 1 },
  });
  return taskRunner;
}

const apiConfig: Partial<OrkesApiConfig> = {
  keyId: process.env.ORKES_API_KEY_ID || "",
  keySecret: process.env.ORKES_API_KEY_SECRET || "",
  serverUrl: process.env.ORKES_API_URL || "",
};

async function initateConductorWorkers() {
  const client = await orkesConductorClient(apiConfig);

  const taskRunner = createTaskRunner(client);
  taskRunner.startPolling();
}

initateConductorWorkers();
