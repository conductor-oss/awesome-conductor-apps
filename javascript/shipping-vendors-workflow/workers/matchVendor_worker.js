// workers/matchVendors_worker.js
import { TaskManager } from "@io-orkes/conductor-javascript";
import { getConductorClient } from "../config/conductorClient.js";

import {
  findEligibleVendors,
  calculatePrice,
  calculateDeliveryTime,
} from "../utils/compute.mjs";

/**
 * Normalize priority input.
 * Accepts "1"|"2"|"3", 1|2|3, or "fast"|"normal"|"cheap"
 * Returns one of: "fast" | "normal" | "cheap"
 */
function normalizePriority(p) {
  if (p === 1 || p === "1") return "fast";
  if (p === 2 || p === "2") return "normal";
  if (p === 3 || p === "3") return "cheap";
  // default to normal if unclear
  return "normal";
}

async function initWorker() {
  // Use shared client that reads token from .env.local via config/conductorClient.js
  const client = await getConductorClient();

  const matchVendorsWorker = {
    taskDefName: "matchVendors",

    /**
     * Expected inputs (from workflow):
     * - Origin_Port (string)
     * - Destination_Port (string)
     * - Total_Volume (number, ft^3)
     * - Priority (1|2|3 or "fast"|"normal"|"cheap")
     *
     * Output on success:
     * - matchedVendors: Array<{ vendorName, containerSize, containerType, price, deliveryTime, reliabilityScore, optimalScore }>
     *
     * Failure:
     * - throws Error -> task FAILS (desired behavior for this step)
     */
    execute: async ({ inputData: { Origin_Port, Destination_Port, Total_Volume, Priority } }) => {
      // Basic validation
      if (!Origin_Port || !Destination_Port || Total_Volume == null) {
        throw new Error("Missing required input: Origin_Port, Destination_Port, and Total_Volume are required.");
      }

      // Coerce volume to a positive number
      const volumeNum = Number(Total_Volume);
      if (!Number.isFinite(volumeNum) || volumeNum <= 0) {
        throw new Error("Total_Volume must be a positive number (ft^3).");
      }

      // Normalize priority to "fast" | "normal" | "cheap"
      const priorityNorm = normalizePriority(Priority);

      // 1) Filter to eligible vendors, also attaches the smallest fitting container as `containerMatch`
      const eligibleVendors = findEligibleVendors(Origin_Port, Destination_Port, volumeNum);

      if (!eligibleVendors || eligibleVendors.length === 0) {
        throw new Error("No eligible vendors found for the given ports and volume.");
      }

      // 2) Compute price, delivery time, and a simple optimal score for each eligible vendor
      const vendorDetails = eligibleVendors.map((v) => {
        const c = v.containerMatch; // { size, type, volume_ft3 }
        if (!c || !c.size || !c.type) {
          // Defensive check: findEligibleVendors should always set containerMatch
          throw new Error(`Eligible vendor missing containerMatch: ${v.vendor_name}`);
        }

        const price = calculatePrice(v, Origin_Port, Destination_Port, c.size, volumeNum);
        const deliveryTime = calculateDeliveryTime(v, Origin_Port, Destination_Port, priorityNorm);

        // Simple weighted score: lower is better; you may refine this later
        const optimalScore = parseFloat(((0.7 * price) + (0.3 * deliveryTime)).toFixed(2));

        return {
          vendorName: v.vendor_name,
          containerSize: c.size,
          containerType: c.type,
          price,
          deliveryTime,
          reliabilityScore: v.reliability_score,
          optimalScore
        };
      });

      // 3) Return the computed list for downstream tasks (e.g., inline topOptions)
      return {
        outputData: {
          matchedVendors: vendorDetails,
          // Audit trail for order/vendor matching with UTC timestamp
          audit: `Order successfully matched with ${vendorDetails.length} vendors on ${new Date().toISOString()} UTC`
        },
        status: "COMPLETED"
      };
      
    }
  };

  // Start polling
  const manager = new TaskManager(client, [matchVendorsWorker], {
    options: { pollInterval: 100, concurrency: 1 },
  });

  manager.startPolling();
  console.log("✅ Worker 'matchVendors' started and polling for tasks...");
}

initWorker();
