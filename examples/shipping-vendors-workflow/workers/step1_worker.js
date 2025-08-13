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

import {
  orkesConductorClient,
  TaskManager,
} from "@io-orkes/conductor-javascript";

import { findProduct, calculateVolume } from "../utils/compute.mjs"; // use ES module import
import { readFile } from "fs/promises";
const products = JSON.parse(await readFile(new URL("../mockData/mockProducts.json", import.meta.url)));


const TASK_NAME = "getProductDetails";

async function initWorker() {
  const clientPromise = orkesConductorClient({
    TOKEN: "YOUR_TOKEN_HERE",
    serverUrl: "https://developer.orkescloud.com/api"
  });

  const client = await clientPromise;

  const getProductDetailsWorker = {
    taskDefName: TASK_NAME,
    execute: async ({ inputData: { SKU, Units }, taskId }) => {
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
    
      let totalVolume, totalWeight;
      const hasDimensions = product.dimensions_cm?.length && product.dimensions_cm?.width && product.dimensions_cm?.height;
      const hasWeight = product.weight_kg;
    
      if (hasDimensions) {
        totalVolume = calculateVolume(product, Units);
      } else {
        totalVolume = "product lacks information to determine order volume/weight";
      }
    
      if (hasWeight) {
        totalWeight = product.weight_kg * Units;
      } else {
        totalWeight = "product lacks information to determine order volume/weight";
      }
    
      return {
        outputData: {
          productName: product.name,
          totalVolume,
          totalWeight,
          isValidProduct: true
        },
        status: "COMPLETED",
      };
    }    
  };

  const manager = new TaskManager(client, [getProductDetailsWorker], {
    options: { pollInterval: 100, concurrency: 1 },
  });

  manager.startPolling();
  console.log(`✅ Worker '${TASK_NAME}' started and polling for tasks...`);
}

initWorker();
