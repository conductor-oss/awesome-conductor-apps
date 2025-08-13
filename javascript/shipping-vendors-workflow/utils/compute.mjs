// compute.mjs

// Example input:
// {
//   sku: "12345",
//   units: 100,
//   destination: "NYC",
//   shipmentDate: "2025-08-10",
//   priority: "normal" // could be "fast", "cheap", "normal"
// }

import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";



// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load JSON files
const products = JSON.parse(await readFile(join(__dirname, "../mockData/mockProducts.json")));
const vendors = JSON.parse(await readFile(join(__dirname, "../mockData/mockShippingVendors.json")));
const distMod = await import("../mockData/distances.js");
//const distances = distMod.distances;
const getDistance = distMod.getDistance;

// Base rates for container sizes
const BASE_RATES = {
  "20ft": 1200,
  "40ft": 2000,
  "40ft_highcube": 2200,
};



/**
 * Find product by SKU
 */
function findProduct(sku) {
  return products.find(p => p.sku === sku);
}

/**
 * Calculate total volume needed based on units and single product volume
 */
function calculateVolume(product, units) {
  if (!product || !product.dimensions_cm) return 0;

  const { length, width, height } = product.dimensions_cm;

  const volume_cm3 = length * width * height * units;
  const volume_ft3 = volume_cm3 / 28316.8466;

  return parseFloat(volume_ft3.toFixed(2));
}


/**
 * Calculate shipment price based on container size, route distance, volume, and vendor factor.
 */
function calculatePrice(vendor, origin, destination, containerSize, volume) {
  
  const baseContainerRate = BASE_RATES[containerSize] ?? 1800;

  // Distance-based charge (use named export helper; fallback if route missing)
  const dist = getDistance(origin, destination) ?? 1000;
  const distanceCharge = dist * 1.5;

  // Volume surcharge (normalize against 1000 ft³)
  const volumeFactor = Math.max(0, volume / 1000);
  const volumeSurcharge = volumeFactor * 600; // 1000 * 0.6

  // Vendor-specific multiplier
  const vendorFactor = Number.isFinite(vendor.price_factor) ? vendor.price_factor : 1.0;

  // Compose final price (rounded to 2 decimals)
  return Math.round((baseContainerRate + distanceCharge + volumeSurcharge) * vendorFactor * 100) / 100;
}

/**
 * Estimate delivery time (days) based on route distance, priority, and vendor reliability.
 * Expects priority as "fast" | "normal" | "cheap".
 */
function calculateDeliveryTime(vendor, origin, destination, priority) {
  // Route distance
  const dist = getDistance(origin, destination) ?? 1000;

  // Base travel speed (~500 distance units/day)
  let baseDays = dist / 500;

  // Priority adjustment
  if (priority === "fast") baseDays *= 0.75;
  else if (priority === "cheap") baseDays *= 1.25;

  // Reliability penalty (lower reliability => more days)
  const reliability = Number.isFinite(vendor.reliability_score) ? vendor.reliability_score : 4.0; // sane default
  baseDays *= 1 + (1 - (reliability / 5)); // scale 0..1 based on 0..5 score

  return Math.ceil(baseDays);
}


/**
 * Find eligible vendors for a route and volume, attaching the smallest fitting container.
 */
function findEligibleVendors(origin, destination, totalVolume) {
  const eligibleVendors = [];

  for (const vendor of vendors) {
    // Must serve both ports
    if (!vendor.origin_ports.includes(origin) || !vendor.destination_ports.includes(destination)) {
      continue;
    }

    // Find the smallest container that fits the volume
    const containerMatch = vendor.container_types
      .filter(ct => ct.volume_ft3 >= totalVolume)
      .sort((a, b) => a.volume_ft3 - b.volume_ft3)[0];

    if (!containerMatch) {
      continue; // No container can handle the volume
    }

    // Create a new vendor object that includes all original fields + containerMatch
    const vendorWithMatch = {
      vendor_name: vendor.vendor_name,
      origin_ports: vendor.origin_ports,
      destination_ports: vendor.destination_ports,
      container_types: vendor.container_types,
      door_to_door_supported: vendor.door_to_door_supported,
      reliability_score: vendor.reliability_score,
      price_factor: vendor.price_factor,
      speed_factor: vendor.speed_factor,
      containerMatch: containerMatch
    };

    eligibleVendors.push(vendorWithMatch);
  }

  return eligibleVendors;
}



/**
 * Main function to generate shipping quotes
 * - Uses totalVolume to find eligible vendors (with containerMatch)
 * - Prices/times each vendor using the matched container size
 * - Returns cheapest, fastest, and optimal options
 */
function generateQuotes(input) {
  let { sku, units, destination, priority } = input;

  // Normalize priority if numeric ("1"|"2"|"3")
  const pmap = { "1": "fast", "2": "normal", "3": "cheap" };
  priority = pmap[String(priority)] ?? priority ?? "normal";

  // Find product + origin; compute total volume (ft³)
  const product = findProduct(sku);
  if (!product) throw new Error("Product not found for SKU: " + sku);
  const origin = product.originPort;
  const totalVolume = calculateVolume(product, units);

  // Get vendors that serve the route and have a container that fits totalVolume
  const eligibleVendors = findEligibleVendors(origin, destination, totalVolume);
  if (!eligibleVendors || eligibleVendors.length === 0) {
    throw new Error("No vendors found for route and volume.");
  }

  // Build quotes using each vendor’s matched container
  const quotes = eligibleVendors.map(vendor => {
    const size = vendor.containerMatch.size; // "20ft" | "40ft" | "40ft_highcube"
    const price = calculatePrice(vendor, origin, destination, size, totalVolume);
    const deliveryTime = calculateDeliveryTime(vendor, origin, destination, priority);
    return {
      vendor: vendor.vendor_name,
      price,
      deliveryTime,
      containerSize: size,
      origin,
      destination,
      reliabilityScore: vendor.reliability_score
    };
  });

  // Derive cheapest, fastest, optimal
  const cheapest = quotes.reduce((a, b) => (b.price < a.price ? b : a));
  const fastest = quotes.reduce((a, b) => (b.deliveryTime < a.deliveryTime ? b : a));

  const maxPrice = Math.max(...quotes.map(q => q.price));
  const maxTime = Math.max(...quotes.map(q => q.deliveryTime));
  const score = q => 0.7 * (q.price / (maxPrice || 1)) + 0.3 * (q.deliveryTime / (maxTime || 1));
  const optimal = quotes.reduce((a, b) => (score(b) < score(a) ? b : a));

  return { cheapest, fastest, optimal };
}


export {
  generateQuotes,
  findProduct,
  calculateVolume,
  calculatePrice,
  calculateDeliveryTime,
  findEligibleVendors
};

