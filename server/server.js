import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store the config OUTSIDE of OneDrive-synced folders to prevent sync conflicts
// that could cause admin changes to revert. Uses Windows AppData\Local or the
// project directory as a fallback.
const CONFIG_DIR = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "CarStorageApp")
  : process.env.DATA_DIR
  ? process.env.DATA_DIR
  : __dirname;
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}
const CONFIG_FILE = path.join(CONFIG_DIR, "server-config.json");

// If config already exists in the old project location, migrate it once
const OLD_CONFIG_FILE = path.join(__dirname, "server-config.json");
if (!fs.existsSync(CONFIG_FILE) && fs.existsSync(OLD_CONFIG_FILE)) {
  try {
    fs.copyFileSync(OLD_CONFIG_FILE, CONFIG_FILE);
    console.log(`[Config] Migrated config from project dir to: ${CONFIG_FILE}`);
  } catch (e) {
    console.warn("[Config] Could not migrate old config file:", e.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Enable trust proxy for platforms like Render so rate limiting gets the real client IP
app.set("trust proxy", 1);

// Rate limiting (max 20 requests per minute per IP for API endpoints)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again after a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
app.use("/api/", apiLimiter);

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
    documentsCard: {
      title: "Required Documents",
      icon: "FileText",
    },
    hoursCard: {
      title: "Business Hours",
      icon: "Clock",
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
    faqs: [
      {
        id: "faq-1",
        question: "What documents do I need to release my vehicle?",
        answer:
          "You will need a government-issued photo ID, proof of ownership (such as registration or title), and valid insurance.",
      },
      {
        id: "faq-2",
        question: "Can someone else pick up my vehicle?",
        answer:
          "Yes, but they must have a notarized authorization letter from the registered owner, a copy of the owner's photo ID, and their own valid ID.",
      },
    ],
    api: {
      mode: "mock",
      appID: "e213b097-ecbe-4b76-bf63-895db701d8c9",
      adminPin: "1234",
    },
    logs: [],
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultSettings, null, 2));
} else {
  // Migration block: Make sure logs and api structures exist
  try {
    const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    let mutated = false;
    if (!configData.logs) {
      configData.logs = [];
      mutated = true;
    }
    if (!configData.faqs) {
      configData.faqs = [
        {
          id: "faq-1",
          question: "What documents do I need to release my vehicle?",
          answer:
            "You will need a government-issued photo ID, proof of ownership (such as registration or title), and valid insurance.",
        },
        {
          id: "faq-2",
          question: "Can someone else pick up my vehicle?",
          answer:
            "Yes, but they must have a notarized authorization letter from the registered owner, a copy of the owner's photo ID, and their own valid ID.",
        },
      ];
      mutated = true;
    }
    if (!configData.api) {
      configData.api = {
        mode: "mock",
        appID: "e213b097-ecbe-4b76-bf63-895db701d8c9",
        adminPin: "1234",
      };
      mutated = true;
    }
    if (mutated) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2));
      console.log(
        "[Config] Migrated existing config file to include missing defaults.",
      );
    }
  } catch (e) {
    console.error(
      "[Config] Failed to run migration check on existing config:",
      e.message,
    );
  }
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

  // Always read PIN from config file (not env) so it never requires a restart
  let validPin = process.env.ADMIN_PIN;
  let currentLogs = [];
  try {
    const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (configData.api?.adminPin) validPin = configData.api.adminPin;
    if (configData.logs) currentLogs = configData.logs;
  } catch (e) {
    /* fallback to env */
  }

  if (pin !== validPin) {
    return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
  }

  try {
    // Preserve existing logs to prevent concurrency overwrites
    newConfig.logs = currentLogs;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    res.json({ success: true, message: "Configuration saved successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to save configuration." });
  }
});

// 2b. Add search log entry
app.post("/api/log", (req, res) => {
  const { query, success, details } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (!configData.logs) configData.logs = [];

    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      query: query.toUpperCase(),
      success: !!success,
      details: details || "",
    };

    // Prepend and limit logs size to 100 entries to prevent infinite growth
    configData.logs = [newLog, ...configData.logs].slice(0, 100);

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2));
    res.json({ success: true, log: newLog });
  } catch (error) {
    res.status(500).json({ error: "Failed to record search log." });
  }
});

// 2c. Clear search logs (requires PIN validation)
app.post("/api/clear-logs", (req, res) => {
  const { pin } = req.body;

  let validPin = process.env.ADMIN_PIN;
  try {
    const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (configData.api?.adminPin) validPin = configData.api.adminPin;
  } catch (e) {
    /* fallback to env */
  }

  if (pin !== validPin) {
    return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
  }

  try {
    const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    configData.logs = [];
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2));
    res.json({ success: true, message: "Search logs cleared successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear search logs." });
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

  console.log(
    `[Search Proxy] Request received -> Mode: ${mode} | Plate: ${plate || "N/A"} | VIN: ${vin || "N/A"}`,
  );
  console.log(
    `[Search Proxy] Using VTS AppID: ${appID ? appID.substring(0, 8) + "..." : "NONE"}`,
  );

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
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    res.status(404).json({ error: "API Endpoint not found" });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
