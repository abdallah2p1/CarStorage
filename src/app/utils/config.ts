export interface CompanyConfig {
  name: string;
  phone: string;
  address: string;
  towLicense: string;
  storageLicense: string;
  hoursNotice: string;
  logoText: string;
  heroTitle: string;
  heroSubtitle: string;
}

export interface BusinessHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface CardConfig {
  title: string;
  icon: string;
  notice?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface SearchLog {
  id: string;
  timestamp: string;
  query: string;
  success: boolean;
  details?: string;
}

export interface ApiConfig {
  mode: "mock" | "dev" | "prod";
  appID: string;
  adminPin: string;
}

export interface AppConfig {
  company: CompanyConfig;
  documentsCard: CardConfig;
  hoursCard: CardConfig;
  hours: BusinessHour[];
  faqs: FAQItem[];
  api: ApiConfig;
  logs: SearchLog[];
  requiredDocuments: string[];
}

const DEFAULT_CONFIG: AppConfig = {
  company: {
    name: "Poppy Auto Storage",
    phone: "(555) 123-4567",
    address: "123 Main Street, Los Angeles, CA 90001",
    towLicense: "123456",
    storageLicense: "789012",
    hoursNotice: "Vehicles can only be released during normal business hours.",
    logoText: "Poppy Auto Storage",
    heroTitle: "Find your towed vehicle.",
    heroSubtitle: "Enter your license plate or VIN to check if your vehicle is in our facility and see outstanding charges.",
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
    { day: "Monday", open: "08:00 AM", close: "05:00 PM", closed: false },
    { day: "Tuesday", open: "08:00 AM", close: "05:00 PM", closed: false },
    { day: "Wednesday", open: "08:00 AM", close: "05:00 PM", closed: false },
    { day: "Thursday", open: "08:00 AM", close: "05:00 PM", closed: false },
    { day: "Friday", open: "08:00 AM", close: "05:00 PM", closed: false },
    { day: "Saturday", open: "09:00 AM", close: "01:00 PM", closed: false },
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
      answer: "You will need a government-issued photo ID, proof of ownership (such as registration or title), and valid insurance.",
    },
    {
      id: "faq-2",
      question: "Can someone else pick up my vehicle?",
      answer: "Yes, but they must have a notarized authorization letter from the registered owner, a copy of the owner's photo ID, and their own valid ID.",
    },
  ],
  api: {
    mode: "mock",
    appID: "e213b097-ecbe-4b76-bf63-895db701d8c9",
    adminPin: "1234",
  },
  logs: [],
};

const STORAGE_KEY = "tow_lookup_config";

export function getConfig(): AppConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse config from localStorage:", error);
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save config to localStorage:", error);
  }
}

export function addSearchLog(query: string, success: boolean, details?: string): void {
  try {
    const config = getConfig();
    const newLog: SearchLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      query,
      success,
      details,
    };
    config.logs = [newLog, ...config.logs];
    saveConfig(config);
  } catch (error) {
    console.error("Failed to add search log:", error);
  }
}

export function clearSearchLogs(): void {
  try {
    const config = getConfig();
    config.logs = [];
    saveConfig(config);
  } catch (error) {
    console.error("Failed to clear search logs:", error);
  }
}
