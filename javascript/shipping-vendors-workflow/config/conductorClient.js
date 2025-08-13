// config/conductorClient.js
import dotenv from "dotenv";
import { orkesConductorClient } from "@io-orkes/conductor-javascript";

dotenv.config({ path: ".env.local" });

export async function getConductorClient() {
  return await orkesConductorClient({
    TOKEN: process.env.ORKES_TOKEN,
    serverUrl: "https://developer.orkescloud.com/api",
  });
}
