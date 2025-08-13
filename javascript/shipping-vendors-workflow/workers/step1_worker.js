/*
 * To set up the project, install the dependencies, and run the application, follow these steps:
 *
 * 1. Install the Conductor JavaScript SDK:
 *    npm install @io-orkes/conductor-javascript
 *    or
 *    yarn add @io-orkes/conductor-javascript
 *
 * 2. Run the JavaScript file (replace yourFile.js with your actual file name):
 *    node yourFile.js
 */

// Import Orkes Conductor SDK components
// step1_worker.js

// workers/step1_worker.js
// Runs the "getProductDetails" Worker Task

import { TaskManager } from "@io-orkes/conductor-javascript";
import { getConductorClient } from "../config/conductorClient.js";  // <-- note the path
import { findProduct, calculateVolume } from "../utils/compute.mjs";

const TASK_NAME = "getProductDetails";

async function initWorker() {
  // Use the shared client that loads TOKEN from .env.local via conductorClient.js
  const client = await getConductorClient();

  const getProductDetailsWorker = {
    taskDefName: TASK_NAME,
    execute: async ({ inputData: { SKU, Units }, taskId }) => {
      // Basic validation
      if (!SKU) {
        return {
          outputData: {
            isValidProduct: false,
            error: "SKU is required to fetch product details",
          },
          status: "COMPLETED",
        };
      }
      if (!Units || Units <= 0) {
        return {
          outputData: {
            isValidProduct: false,
            error: "desired units below 0, must order a valid number of units",
          },
          status: "COMPLETED",
        };
      }

      // Lookup product from mock DB (compute.mjs reads JSON)
      const product = findProduct(SKU);
      if (!product) {
        return {
          outputData: {
            isValidProduct: false,
            error: "Invalid SKU please refer to the README and select a valid SKU",
          },
          status: "COMPLETED",
        };
      }

      // Compute totals (volume in ft^3, weight in kg)
      const hasDims =
        product.dimensions_cm?.length &&
        product.dimensions_cm?.width &&
        product.dimensions_cm?.height;

      const hasWeight = Number.isFinite(product.weight_kg);

      const totalVolume = hasDims
        ? calculateVolume(product, Units)
        : "product lacks information to determine order volume/weight";

      const totalWeight = hasWeight
        ? product.weight_kg * Units
        : "product lacks information to determine order volume/weight";

        return {
          outputData: {
            productName: product.name,
            totalVolume,   // ft^3 (rounded)
            totalWeight,   // kg
            isValidProduct: true,
            // Audit trail for SKU lookup with UTC timestamp
            audit: `SKU '${SKU}' returned product '${product.name}' on ${new Date().toISOString()} UTC`
          },
          status: "COMPLETED",
        };        
    },
  };

  const manager = new TaskManager(client, [getProductDetailsWorker], {
    options: { pollInterval: 100, concurrency: 1 },
  });

  manager.startPolling();
  console.log(`✅ Worker '${TASK_NAME}' started and polling for tasks...`);
}

initWorker();

