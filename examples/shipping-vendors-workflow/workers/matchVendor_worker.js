// matchVendors_worker.js

import {
    orkesConductorClient,
    TaskManager,
  } from "@io-orkes/conductor-javascript";
  
  import {
    findEligibleVendors,
    calculatePrice,
    calculateDeliveryTime,
  } from "../utils/compute.mjs";
  
  async function initWorker() {
    const clientPromise = orkesConductorClient({
      TOKEN: "YOUR_TOKEN_HERE",
      serverUrl: "https://developer.orkescloud.com/api",
    });
  
    const client = await clientPromise;
  
    const matchVendorsWorker = {
      taskDefName: "matchVendors",
      execute: async ({ inputData: { Origin_Port, Destination_Port, Total_Volume, Priority }, taskId }) => {
        if (!Origin_Port || !Destination_Port || !Total_Volume || !Priority) {
          throw new Error("Missing required input fields: Origin_Port, Destination_Port, Total_Volume, or Priority.");
        }
  
        const eligibleVendors = findEligibleVendors(Origin_Port, Destination_Port, Total_Volume);
  
        if (eligibleVendors.length === 0) {
          throw new Error("No eligible vendors found for the given ports and volume.");
        }
  
        // Calculate price, delivery time, and optimal score for each eligible vendor
        const vendorDetails = eligibleVendors.map(vendor => {
          const container = vendor.containerMatch; // populated by findEligibleVendors()
          const price = calculatePrice(vendor, Origin_Port, Destination_Port, container.size, Total_Volume);
          const deliveryTime = calculateDeliveryTime(vendor, Origin_Port, Destination_Port, Priority);
  
          return {
            vendorName: vendor.vendor_name,
            containerSize: container.size,
            containerType: container.type,
            price,
            deliveryTime,
            reliabilityScore: vendor.reliability_score,
            optimalScore: parseFloat(((0.7 * price) + (0.3 * deliveryTime)).toFixed(2)) // basic example scoring
          };
        });
  
        return {
          outputData: {
            matchedVendors: vendorDetails
          },
          status: "COMPLETED"
        };
      }
    };
  
    const manager = new TaskManager(client, [matchVendorsWorker], {
      options: { pollInterval: 100, concurrency: 1 },
    });
  
    manager.startPolling();
    console.log("✅ Worker 'matchVendors' started and polling for tasks...");
  }
  
  initWorker();
  