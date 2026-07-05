import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, "server-config.json");

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize server-config.json if it doesn't exist
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultSettings = {
    company: {
      name: "Poppy Auto Storage",
      phone: "(818) 555-0192",
      address: "14720 Raymer Street, Van Nuys, CA 91405",
      towLicense: "TL-2024-00481",
      storageLicense: "ST-2024-00192",
      hoursNotice:
        "Vehicles can only be retrieved during regular business hours.",
      logoText: "Poppy Auto Storage",
      heroTitle: "Find your towed vehicle.",
      heroSubtitle:
        "Enter your license plate or VIN to check if your vehicle is in our facility and see outstanding charges.",
    },
    hours: [
      { day: "Monday", open: "08:00 AM", close: "06:00 PM", closed: false },
      { day: "Tuesday", open: "08:00 AM", close: "06:00 PM", closed: false },
      { day: "Wednesday", open: "08:00 AM", close: "06:00 PM", closed: false },
      { day: "Thursday", open: "08:00 AM", close: "06:00 PM", closed: false },
      { day: "Friday", open: "08:00 AM", close: "06:00 PM", closed: false },
      { day: "Saturday", open: "09:00 AM", close: "04:00 PM", closed: false },
      { day: "Sunday", open: "12:00 AM", close: "12:00 AM", closed: true },
    ],
    requiredDocuments: [
      "Government-issued Photo ID",
      "Proof of Ownership (Title or Registration)",
      "Valid Insurance Card",
    ],
    api: {
      mode: "mock",
      appID: "e213b097-ecbe-4b76-bf63-895db701d8c9",
      adminPin: "1234",
    },
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultSettings, null, 2));
}

// ─── API ENDPOINTS ───

// 1. Get CMS Configurations
app.get("/api/config", (req, res) => {
  try {
    const data = fs.readFileSync(CONFIG_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Failed to read server configuration." });
  }
});

// 2. Update CMS Configurations (requires PIN validation)
app.post("/api/config", (req, res) => {
  const { pin, newConfig } = req.body;

  if (pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
  }

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    res.json({ success: true, message: "Configuration saved successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to save configuration." });
  }
});

// 3. Secure Proxy for VTSCLOUD XML Search Lookup (Bypasses CORS)
app.get("/api/lookup", async (req, res) => {
  const { mode, plate, vin } = req.query;
  
  // Read the real Application Key from the user's CMS settings
  let appID = process.env.VTS_APP_ID;
  try {
    const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (configData.api && configData.api.appID) {
      appID = configData.api.appID;
    }
  } catch (err) {
    console.error("Could not read config file, falling back to env App ID");
  }

  if (!appID) {
    return res
      .status(500)
      .send(
        "<errorStatus>false</errorStatus><errorMessage>Server misconfigured: VTS_APP_ID is missing.</errorMessage>",
      );
  }

  const normPlate = (plate || "").trim().toUpperCase();
  const normVin = (vin || "").trim().toUpperCase();

  // Connect to the respective API endpoint (Dev sandbox vs Production)
  const baseUrl =
    mode === "prod"
      ? "https://myvtscloud.net/WebServices/exportTowedVehicle.asmx"
      : "https://cktsystems.com/vtsCloud/WebServices/exportTowedVehicle.asmx";

  const targetUrl = new URL(`${baseUrl}/getTowedVehicleDetails`);

  const bodyParams = new URLSearchParams();
  bodyParams.append("appID", appID);
  bodyParams.append("VIN", normVin);
  bodyParams.append("licensePlate", normPlate);
  bodyParams.append("year", "");
  bodyParams.append("vehicleMake", "");
  bodyParams.append("vehicleModel", "");
  bodyParams.append("towedDate", "");
  bodyParams.append("ownerName", "");
  bodyParams.append("vehicleInLotOnly", "false");

  try {
    const vtsResponse = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams,
    });
    const xmlText = await vtsResponse.text();

    // Send raw XML back to the browser client with CORS headers enabled
    res.set("Content-Type", "application/xml");
    res.send(xmlText);
  } catch (error) {
    res
      .status(500)
      .send(
        `<errorStatus>false</errorStatus><errorMessage>Proxy failed connecting to VTSCLOUD: ${error.message}</errorMessage>`,
      );
  }
});

// Serve static assets from Vite's build directory (dist)
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

// Fallback for Single Page Application routing (React Router client-side routes)
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    res.status(404).json({ error: "API Endpoint not found" });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
