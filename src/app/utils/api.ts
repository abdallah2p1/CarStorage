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
  
  // Extended fields for details view:
  color?: string;
  licenseState?: string;
  towType?: string;
  towReason?: string;
  towedStreet?: string;
  towedCityName?: string;
  towedStateName?: string;
  towedZipCode?: string;
  towedDate?: string;
  towedTime?: string;
  subTotal?: number;
  discountTotal?: number;
  taxAmount?: number;
  wreckerCompany?: string;
  wreckerDriver?: string;
  storageStatus?: string;
  receivedDate?: string;
  receivedTime?: string;
  legalDetails?: string;
  stockNumber?: string;
}

export interface LookupApiResponse {
  success: boolean;
  error?: string;
  count: number;
  vehicles: TowedVehicleDetails[];
}

/**
 * Parses VTSCLOUD XML response to extract company, charges, vehicle identifiers and detailed information.
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
        
        color: textVal("vehicleColorName"),
        licenseState: textVal("vehicleLicenseStateName"),
        towType: textVal("towTypeName"),
        towReason: textVal("towReasonName"),
        towedStreet: textVal("towedStreet"),
        towedCityName: textVal("towedCityName"),
        towedStateName: textVal("towedStateName"),
        towedZipCode: textVal("towedZipCode"),
        towedDate: textVal("towedDate"),
        towedTime: textVal("towedTime"),
        subTotal: numVal("towedSubTotal"),
        discountTotal: numVal("towedDiscountTotal"),
        taxAmount: numVal("towedTaxAmount"),
        wreckerCompany: textVal("wreckerCompanyName"),
        wreckerDriver: textVal("wreckerDriverName"),
        storageStatus: textVal("storageStatusName"),
        receivedDate: textVal("storageReceivedDate"),
        receivedTime: textVal("storageReceivedTime"),
        legalDetails: textVal("legalDetails"),
        stockNumber: textVal("stockNumber"),
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
    } else if (normPlate === "9XYZ789" || normVin === "1FTNW20F93EA99999") {
      return parseVtsCloudXml(getMockXmlTesla());
    } else if (normVin === "5GAKRCKD7HJ111111") {
      return parseVtsCloudXml(getMockXmlBuick());
    } else if (normVin === "1FTNW20F93EA33333") {
      return parseVtsCloudXml(getMockXmlLexus());
    } else {
      return parseVtsCloudXml(getMockXmlNotFound());
    }
  }

  const baseUrl = "/api/lookup";
  const url = new URL(baseUrl, window.location.origin);
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
      <vehicleColorName>Red</vehicleColorName>
      <vehicleMakeName>Honda</vehicleMakeName>
      <vehicleModelName>Civic</vehicleModelName>
      <vehicleLicensePlate>7ABC123</vehicleLicensePlate>
      <vehicleLicenseStateName>CA</vehicleLicenseStateName>
      <towTypeName>Police Impound</towTypeName>
      <towReasonName>Expired Registration</towReasonName>
      <towedStreet>1240 Raymer St</towedStreet>
      <towedCityName>Van Nuys</towedCityName>
      <towedStateName>CA</towedStateName>
      <towedZipCode>91405</towedZipCode>
      <towedDate>07-01-2026</towedDate>
      <towedTime>14:30</towedTime>
      <towedSubTotal>450.00</towedSubTotal>
      <towedDiscountTotal>0.00</towedDiscountTotal>
      <towedTaxAmount>45.00</towedTaxAmount>
      <towedBalance>495.00</towedBalance>
      <stockNumber>P-202410</stockNumber>
      <wreckerCompanyName>Poppy Towing</wreckerCompanyName>
      <wreckerDriverName>John Doe</wreckerDriverName>
      <storageStatusName>In Lot</storageStatusName>
      <storageReceivedDate>07-01-2026</storageReceivedDate>
      <storageReceivedTime>15:00</storageReceivedTime>
      <legalDetails>TDLR Regulations: Stored in accordance with municipal codes. Release requires payment of outstanding fees, government photo ID, and registration proof.</legalDetails>
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
      <vehicleColorName>Black</vehicleColorName>
      <vehicleMakeName>Buick</vehicleMakeName>
      <vehicleModelName>Enclave</vehicleModelName>
      <vehicleLicensePlate>COOLDUDE</vehicleLicensePlate>
      <vehicleLicenseStateName>TX</vehicleLicenseStateName>
      <towTypeName>Police Abandoned(HCSO)</towTypeName>
      <towReasonName>Abandon Vehicle</towReasonName>
      <towedStreet>1303 Campbell Road</towedStreet>
      <towedCityName>Katy</towedCityName>
      <towedStateName>TX</towedStateName>
      <towedZipCode>77494</towedZipCode>
      <towedDate>12-26-2023</towedDate>
      <towedTime>23:41</towedTime>
      <towedSubTotal>208.59</towedSubTotal>
      <towedDiscountTotal>0.00</towedDiscountTotal>
      <towedTaxAmount>27.97</towedTaxAmount>
      <towedBalance>236.56</towedBalance>
      <towedInvoice>15906</towedInvoice>
      <stockNumber>C312004</stockNumber>
      <wreckerCompanyName>Westway Towing, Inc.</wreckerCompanyName>
      <wreckerDriverName>Andrew Pestell</wreckerDriverName>
      <storageStatusName>In Lot</storageStatusName>
      <storageReceivedDate>12-26-2023</storageReceivedDate>
      <storageReceivedTime>23:41</storageReceivedTime>
      <legalDetails>TDLR Regulations: Vehicle impounded as abandoned on public roadway by HCSO command.</legalDetails>
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
    <vehicleDetails>
      <id>1958619</id>
      <VIN>1FTNW20F93EA33333</VIN>
      <vehicleYear>2017</vehicleYear>
      <vehicleColorName>Black</vehicleColorName>
      <vehicleMakeName>Lexus</vehicleMakeName>
      <vehicleModelName>IS 350</vehicleModelName>
      <vehicleLicensePlate>COOLDUDE</vehicleLicensePlate>
      <vehicleLicenseStateName>TX</vehicleLicenseStateName>
      <towTypeName>Police Abandoned(HCSO)</towTypeName>
      <towReasonName>Abandon Vehicle</towReasonName>
      <towedStreet>4422 Campbell Road</towedStreet>
      <towedCityName>Katy</towedCityName>
      <towedStateName>TX</towedStateName>
      <towedZipCode>77494</towedZipCode>
      <towedDate>10-11-2023</towedDate>
      <towedTime>22:05</towedTime>
      <towedSubTotal>569.04</towedSubTotal>
      <towedDiscountTotal>0.00</towedDiscountTotal>
      <towedTaxAmount>31.23</towedTaxAmount>
      <towedBalance>600.27</towedBalance>
      <towedInvoice>15865</towedInvoice>
      <stockNumber>C312003</stockNumber>
      <wreckerCompanyName>Westway Towing, Inc.</wreckerCompanyName>
      <wreckerDriverName>Andrew Pestell</wreckerDriverName>
      <storageStatusName>In Lot</storageStatusName>
      <storageReceivedDate>12-26-2023</storageReceivedDate>
      <storageReceivedTime>23:31</storageReceivedTime>
      <legalDetails>TDLR Regulations: Vehicle impounded as abandoned on public roadway. Release requires verification of registration and valid insurance.</legalDetails>
      <storageCompanyName>Westway Storage</storageCompanyName>
      <vehicleCharges>
        <lineCharges>
          <vehicleChargesDetails>
            <towChargesName>Storage Fee</towChargesName>
            <totalCharges>357.51</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Impound Fee</towChargesName>
            <totalCharges>21.03</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Towing Fee</towChargesName>
            <totalCharges>145.50</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Dollies Fee</towChargesName>
            <totalCharges>45.00</totalCharges>
          </vehicleChargesDetails>
        </lineCharges>
      </vehicleCharges>
    </vehicleDetails>
  </vehicles>
</towedVehicleDetailsList>`;
}

function getMockXmlTesla() {
  return `<?xml version="1.0"?>
<towedVehicleDetailsList>
  <errorStatus>true</errorStatus>
  <errorMessage>Success</errorMessage>
  <count>1</count>
  <vehicles>
    <vehicleDetails>
      <id>3058102</id>
      <VIN>1FTNW20F93EA99999</VIN>
      <vehicleYear>2023</vehicleYear>
      <vehicleColorName>Black</vehicleColorName>
      <vehicleMakeName>Tesla</vehicleMakeName>
      <vehicleModelName>Model Y</vehicleModelName>
      <vehicleLicensePlate>9XYZ789</vehicleLicensePlate>
      <vehicleLicenseStateName>CA</vehicleLicenseStateName>
      <towTypeName>Private Property Tow</towTypeName>
      <towReasonName>Parked in Fire Lane</towReasonName>
      <towedStreet>500 Grand Ave</towedStreet>
      <towedCityName>Los Angeles</towedCityName>
      <towedStateName>CA</towedStateName>
      <towedZipCode>90012</towedZipCode>
      <towedDate>07-03-2026</towedDate>
      <towedTime>08:15</towedTime>
      <towedSubTotal>410.00</towedSubTotal>
      <towedDiscountTotal>0.00</towedDiscountTotal>
      <towedTaxAmount>40.00</towedTaxAmount>
      <towedBalance>450.00</towedBalance>
      <stockNumber>P-202415</stockNumber>
      <wreckerCompanyName>Poppy Towing</wreckerCompanyName>
      <wreckerDriverName>Mike Smith</wreckerDriverName>
      <storageStatusName>In Lot</storageStatusName>
      <storageReceivedDate>07-03-2026</storageReceivedDate>
      <storageReceivedTime>09:00</storageReceivedTime>
      <legalDetails>TDLR Regulations: Unauthorized vehicle parked in marked fire lane. Removed at request of property owner.</legalDetails>
      <storageCompanyName>Poppy Auto Storage</storageCompanyName>
      <vehicleCharges>
        <lineCharges>
          <vehicleChargesDetails>
            <towChargesName>Towing Fee</towChargesName>
            <totalCharges>250.00</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Storage Fee</towChargesName>
            <totalCharges>100.00</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Impound Fee</towChargesName>
            <totalCharges>100.00</totalCharges>
          </vehicleChargesDetails>
        </lineCharges>
      </vehicleCharges>
    </vehicleDetails>
  </vehicles>
</towedVehicleDetailsList>`;
}

function getMockXmlBuick() {
  return `<?xml version="1.0"?>
<towedVehicleDetailsList>
  <errorStatus>true</errorStatus>
  <errorMessage>Success</errorMessage>
  <count>1</count>
  <vehicles>
    <vehicleDetails>
      <id>1958666</id>
      <VIN>5GAKRCKD7HJ111111</VIN>
      <vehicleYear>2017</vehicleYear>
      <vehicleColorName>Black</vehicleColorName>
      <vehicleMakeName>Buick</vehicleMakeName>
      <vehicleModelName>Enclave</vehicleModelName>
      <vehicleLicensePlate>COOLDUDE</vehicleLicensePlate>
      <vehicleLicenseStateName>TX</vehicleLicenseStateName>
      <towTypeName>Police Abandoned(HCSO)</towTypeName>
      <towReasonName>Abandon Vehicle</towReasonName>
      <towedStreet>1303 Campbell Road</towedStreet>
      <towedCityName>Katy</towedCityName>
      <towedStateName>TX</towedStateName>
      <towedZipCode>77494</towedZipCode>
      <towedDate>12-26-2023</towedDate>
      <towedTime>23:41</towedTime>
      <towedSubTotal>208.59</towedSubTotal>
      <towedDiscountTotal>0.00</towedDiscountTotal>
      <towedTaxAmount>27.97</towedTaxAmount>
      <towedBalance>236.56</towedBalance>
      <towedInvoice>15906</towedInvoice>
      <stockNumber>C312004</stockNumber>
      <wreckerCompanyName>Westway Towing, Inc.</wreckerCompanyName>
      <wreckerDriverName>Andrew Pestell</wreckerDriverName>
      <storageStatusName>In Lot</storageStatusName>
      <storageReceivedDate>12-26-2023</storageReceivedDate>
      <storageReceivedTime>23:41</storageReceivedTime>
      <legalDetails>TDLR Regulations: Vehicle impounded as abandoned on public roadway by HCSO command.</legalDetails>
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

function getMockXmlLexus() {
  return `<?xml version="1.0"?>
<towedVehicleDetailsList>
  <errorStatus>true</errorStatus>
  <errorMessage>Success</errorMessage>
  <count>1</count>
  <vehicles>
    <vehicleDetails>
      <id>1958619</id>
      <VIN>1FTNW20F93EA33333</VIN>
      <vehicleYear>2017</vehicleYear>
      <vehicleColorName>Black</vehicleColorName>
      <vehicleMakeName>Lexus</vehicleMakeName>
      <vehicleModelName>IS 350</vehicleModelName>
      <vehicleLicensePlate>COOLDUDE</vehicleLicensePlate>
      <vehicleLicenseStateName>TX</vehicleLicenseStateName>
      <towTypeName>Police Abandoned(HCSO)</towTypeName>
      <towReasonName>Abandon Vehicle</towReasonName>
      <towedStreet>4422 Campbell Road</towedStreet>
      <towedCityName>Katy</towedCityName>
      <towedStateName>TX</towedStateName>
      <towedZipCode>77494</towedZipCode>
      <towedDate>10-11-2023</towedDate>
      <towedTime>22:05</towedTime>
      <towedSubTotal>569.04</towedSubTotal>
      <towedDiscountTotal>0.00</towedDiscountTotal>
      <towedTaxAmount>31.23</towedTaxAmount>
      <towedBalance>600.27</towedBalance>
      <towedInvoice>15865</towedInvoice>
      <stockNumber>C312003</stockNumber>
      <wreckerCompanyName>Westway Towing, Inc.</wreckerCompanyName>
      <wreckerDriverName>Andrew Pestell</wreckerDriverName>
      <storageStatusName>In Lot</storageStatusName>
      <storageReceivedDate>12-26-2023</storageReceivedDate>
      <storageReceivedTime>23:31</storageReceivedTime>
      <legalDetails>TDLR Regulations: Vehicle impounded as abandoned on public roadway. Release requires verification of registration and valid insurance.</legalDetails>
      <storageCompanyName>Westway Storage</storageCompanyName>
      <vehicleCharges>
        <lineCharges>
          <vehicleChargesDetails>
            <towChargesName>Storage Fee</towChargesName>
            <totalCharges>357.51</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Impound Fee</towChargesName>
            <totalCharges>21.03</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Towing Fee</towChargesName>
            <totalCharges>145.50</totalCharges>
          </vehicleChargesDetails>
          <vehicleChargesDetails>
            <towChargesName>Dollies Fee</towChargesName>
            <totalCharges>45.00</totalCharges>
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
