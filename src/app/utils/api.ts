export interface LineCharge {
  towChargesName: string;
  totalCharges: number;
}

export interface TowedVehicleDetails {
  id: string;
  year: string;
  make: string;
  model: string;
  plate: string;
  vin: string;
  storageCompany: string; // The storage company name
  towedBalance: number;    // The total charges amount
  charges: LineCharge[];   // Itemized charges
}

export interface LookupApiResponse {
  success: boolean;
  error?: string;
  count: number;
  vehicles: TowedVehicleDetails[];
}

/**
 * Parses VTSCLOUD XML response to extract ONLY company, charges, and vehicle identifiers.
 */
export function parseVtsCloudXml(xmlString: string): LookupApiResponse {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");

    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      return { success: false, error: "XML Parsing Error: " + parserError.textContent, count: 0, vehicles: [] };
    }

    const errorStatusEl = doc.querySelector("errorStatus");
    const errorStatus = errorStatusEl ? errorStatusEl.textContent?.trim().toLowerCase() === "true" : false;
    const errorMessage = doc.querySelector("errorMessage")?.textContent?.trim() || "";

    if (!errorStatus) {
      return { success: false, error: errorMessage || "Vehicle not found.", count: 0, vehicles: [] };
    }

    const vehicleNodes = doc.querySelectorAll("vehicles > vehicleDetails");
    const vehicles: TowedVehicleDetails[] = [];

    vehicleNodes.forEach((node) => {
      const textVal = (selector: string) => node.querySelector(selector)?.textContent?.trim() || "";
      const numVal = (selector: string) => parseFloat(node.querySelector(selector)?.textContent?.trim() || "0");

      // Extract itemized fees (name and total charge)
      const lineChargeNodes = node.querySelectorAll("vehicleCharges > lineCharges > vehicleChargesDetails");
      const charges: LineCharge[] = [];
      lineChargeNodes.forEach((chargeNode) => {
        charges.push({
          towChargesName: chargeNode.querySelector("towChargesName")?.textContent?.trim() || "",
          totalCharges: parseFloat(chargeNode.querySelector("totalCharges")?.textContent?.trim() || "0"),
        });
      });

      vehicles.push({
        id: textVal("id"),
        year: textVal("vehicleYear"),
        make: textVal("vehicleMakeName"),
        model: textVal("vehicleModelName"),
        plate: textVal("vehicleLicensePlate"),
        vin: textVal("VIN"),
        storageCompany: textVal("storageCompanyName"), // Company Name
        towedBalance: numVal("towedBalance"),          // Total Charges Amount
        charges,
      });
    });

    return {
      success: true,
      count: vehicles.length,
      vehicles,
    };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed parsing XML response.", count: 0, vehicles: [] };
  }
}

/**
 * Handles VTSCLOUD XML lookup logic (directly queries endpoint or returns MOCK XML payloads)
 */
export async function lookupVehicle(
  mode: "mock" | "dev" | "prod",
  appID: string,
  plate: string,
  vin: string,
  mockMultiple: boolean
): Promise<LookupApiResponse> {
  const normPlate = plate.trim().toUpperCase();
  const normVin = vin.trim().toUpperCase();

  if (mode === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Network delay
    
    if (normPlate === "COOLDUDE") {
      return parseVtsCloudXml(getMockXmlMultiple());
    } else if (normPlate === "7ABC123" || normVin === "1HGBH41JXMN109186") {
      return parseVtsCloudXml(getMockXmlSingle());
    } else {
      return parseVtsCloudXml(getMockXmlNotFound());
    }
  }

  const baseUrl = "http://localhost:3001/api/lookup";
  const url = new URL(baseUrl);
  url.searchParams.append("mode", mode);
  if (normVin) url.searchParams.append("vin", normVin);
  if (normPlate) url.searchParams.append("plate", normPlate);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const xmlText = await res.text();
    return parseVtsCloudXml(xmlText);
  } catch (error: any) {
    return {
      success: false,
      error: `Network error connecting to VTSCLOUD proxy: ${error.message}. Please check if the backend server is running and Mock Mode in settings.`,
      count: 0,
      vehicles: []
    };
  }
}

// Mock XML Templates (Keep these so offline mode still works)
function getMockXmlSingle() {
  return `<?xml version="1.0"?>
<towedVehicleDetailsList>
  <errorStatus>true</errorStatus>
  <errorMessage>Success</errorMessage>
  <count>1</count>
  <vehicles>
    <vehicleDetails>
      <id>2041289</id>
      <VIN>1HGBH41JXMN109186</VIN>
      <vehicleYear>2021</vehicleYear>
      <vehicleMakeName>Honda</vehicleMakeName>
      <vehicleModelName>Civic</vehicleModelName>
      <vehicleLicensePlate>7ABC123</vehicleLicensePlate>
      <towedBalance>495.00</towedBalance>
      <storageCompanyName>Poppy Auto Storage</storageCompanyName>
      <vehicleCharges>
        <lineCharges>
          <vehicleChargesDetails>
            <towChargesName>Storage Fee</towChargesName>
            <totalCharges>85.00</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Impound Fee</towChargesName>
            <totalCharges>150.00</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Towing Fee</towChargesName>
            <totalCharges>260.00</totalCharges>
          </vehicleChargesDetails>
        </lineCharges>
      </vehicleCharges>
    </vehicleDetails>
  </vehicles>
</towedVehicleDetailsList>`;
}

function getMockXmlMultiple() {
  return `<?xml version="1.0"?>
<towedVehicleDetailsList>
  <errorStatus>true</errorStatus>
  <errorMessage>Success</errorMessage>
  <count>2</count>
  <vehicles>
    <vehicleDetails>
      <id>1958666</id>
      <VIN>5GAKRCKD7HJ111111</VIN>
      <vehicleYear>2017</vehicleYear>
      <vehicleMakeName>Buick</vehicleMakeName>
      <vehicleModelName>Enclave</vehicleModelName>
      <vehicleLicensePlate>COOLDUDE</vehicleLicensePlate>
      <towedBalance>236.56</towedBalance>
      <storageCompanyName>Westway Storage</storageCompanyName>
      <vehicleCharges>
        <lineCharges>
          <vehicleChargesDetails>
            <towChargesName>Storage Fee</towChargesName>
            <totalCharges>63.09</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Towing Fee</towChargesName>
            <totalCharges>145.50</totalCharges>
          </vehicleChargesDetails>
        </lineCharges>
      </vehicleCharges>
    </vehicleDetails>
  </vehicles>
</towedVehicleDetailsList>`;
}

function getMockXmlNotFound() {
  return `<?xml version="1.0"?>
<towedVehicleDetailsList>
  <errorStatus>false</errorStatus>
  <errorMessage>Vehicle not found in database.</errorMessage>
  <count>0</count>
  <vehicles/>
</towedVehicleDetailsList>`;
}
