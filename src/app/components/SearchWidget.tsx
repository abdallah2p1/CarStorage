import { useState } from "react";
import { AlertCircle, Search, Building2, CreditCard, Car, FileText, Calendar, Printer, Scale, Truck } from "lucide-react";
import { lookupVehicle, LookupApiResponse, TowedVehicleDetails } from "../utils/api";
import { getConfig, AppConfig } from "../utils/config";
import { fmt } from "../utils/constants";

export default function SearchWidget({
  onResults,
  compact,
  config,
}: {
  onResults: (res: any) => void;
  compact?: boolean;
  config?: AppConfig;
}) {
  const [mode, setMode] = useState<"plate" | "vin">("plate");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inline search results states
  const [result, setResult] = useState<LookupApiResponse | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<TowedVehicleDetails | null>(null);

  const handlePrint = () => {
    const receiptElement = document.getElementById("printable-receipt");
    if (!receiptElement || !selectedVehicle) return;

    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      alert("Please allow popups to print the receipt.");
      return;
    }

    let stylesHtml = "";
    for (const node of Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))) {
      stylesHtml += node.outerHTML;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}</title>
          ${stylesHtml}
          <style>
            body {
              background: white !important;
              color: black !important;
              padding: 20px !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
            }
            #printable-receipt {
              background: white !important;
              color: black !important;
              border: 1px solid #e5e7eb !important;
              padding: 24px !important;
              border-radius: 16px !important;
              max-width: 600px;
              margin: 0 auto;
              box-shadow: none !important;
            }
            .text-\\[\\#F2EDE8\\] { color: #111827 !important; }
            .text-\\[\\#888880\\] { color: #4b5563 !important; }
            .text-\\[\\#555550\\] { color: #6b7280 !important; }
            .bg-\\[\\#111111\\] { background: #ffffff !important; border: 1px solid #e5e7eb !important; }
            .bg-\\[\\#161616\\] { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
            .bg-\\[\\#161616\\]\\/50 { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
            .bg-\\[\\#D4622A\\]\\/5 { background: #fff7ed !important; border: 1px solid #ffedd5 !important; }
            .border-white\\/5 { border-color: #e5e7eb !important; }
            .divide-white\\/5 > * + * { border-color: #e5e7eb !important; }
            .text-\\[\\#4CAF6A\\] { color: #16a34a !important; }
            .bg-\\[\\#4CAF6A\\]\\/10 { background: #f0fdf4 !important; border-color: #bbf7d0 !important; }
            .text-\\[\\#D4622A\\] { color: #ea580c !important; }
            button { display: none !important; }
          </style>
        </head>
        <body>
          <div id="printable-receipt" class="flex flex-col gap-5 text-left">
            ${receiptElement.innerHTML}
          </div>
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSelectedVehicle(null);
    onResults(null);

    const queryValue = mode === "plate" ? plate.trim() : vin.trim();
    if (!queryValue) {
      setError(`Please enter a ${mode === "plate" ? "license plate" : "VIN"}.`);
      return;
    }

    setLoading(true);
    try {
      const currentConfig = config || getConfig();
      const res = await lookupVehicle(
        currentConfig.api.mode,
        currentConfig.api.appID,
        mode === "plate" ? queryValue : "",
        mode === "vin" ? queryValue : "",
        false
      );

      if (!res.success) {
        setError(res.error || "Vehicle not found in database.");
      } else {
        setResult(res);
        if (res.vehicles.length === 1) {
          setSelectedVehicle(res.vehicles[0]);
        } else {
          setSelectedVehicle(null);
        }
        onResults(res);
      }
    } catch (err: any) {
      setError(err.message || "Search request failed. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-[#1A1A1A] border border-white/5 ${compact ? "p-6 rounded-2xl" : "p-8 rounded-[20px] text-left"}`}>
      {/* Mode toggle */}
      <div className="flex bg-[#111111] rounded-lg p-1 mb-5 gap-1">
        {(["plate", "vin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setResult(null);
              setSelectedVehicle(null);
            }}
            className={`flex-1 py-2 rounded-md text-xs font-semibold cursor-pointer border-none transition-all duration-150 ${
              mode === m ? "bg-[#D4622A] text-white" : "bg-transparent text-[#888880] hover:text-[#F2EDE8]"
            }`}
          >
            {m === "plate" ? "License Plate" : "VIN Number"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch}>
        {/* Search input field */}
        <input
          type="text"
          value={mode === "plate" ? plate : vin}
          onChange={(e) => {
            if (mode === "plate") setPlate(e.target.value);
            else setVin(e.target.value);
            // Clear prior results if user starts typing again
            setResult(null);
            setSelectedVehicle(null);
            setError(null);
          }}
          placeholder={mode === "plate" ? "Enter license plate…" : "Enter 17-char VIN…"}
          maxLength={mode === "plate" ? 10 : 17}
          className={`w-full block bg-[#111111] border border-white/5 rounded-xl px-5 py-4 text-center font-mono text-[#F2EDE8] tracking-widest uppercase focus:border-[#D4622A]/50 outline-none mb-3 ${
            mode === "plate" ? "text-2xl" : "text-sm"
          }`}
        />

        {/* Error prompt */}
        {error && (
          <div className="flex items-center gap-2 mb-3 px-3.5 py-2.5 bg-[#CC3333]/10 border border-[#CC3333]/20 rounded-lg text-[#CC6666] text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit action button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#D4622A] hover:bg-[#C25828] text-white text-sm font-bold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full inline-block animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search
            </>
          )}
        </button>
      </form>

      {/* Mock Mode Helper Banner */}
      {((config || getConfig()).api?.mode === "mock") && (
        <div className="mt-4 p-4 bg-[#D4622A]/5 border border-[#D4622A]/15 rounded-xl text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 bg-[#D4622A] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4622A]">
              Demo Search Credentials
            </span>
          </div>
          <ul className="text-[11px] text-[#888880] list-none p-0 m-0 flex flex-col gap-1.5 leading-relaxed font-sans">
            <li className="flex items-start gap-1">
              <span className="text-[#D4622A]">•</span>
              <span>
                <strong className="text-[#F2EDE8]">Multiple Results:</strong> Plate <code className="bg-[#222] text-[#F2EDE8] px-1.5 py-0.5 rounded font-mono text-[10px]">COOLDUDE</code> (Buick & Lexus)
              </span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-[#D4622A]">•</span>
              <span>
                <strong className="text-[#F2EDE8]">Single Result (Honda):</strong> Plate <code className="bg-[#222] text-[#F2EDE8] px-1.5 py-0.5 rounded font-mono text-[10px]">7ABC123</code> or VIN <code className="bg-[#222] text-[#F2EDE8] px-1.5 py-0.5 rounded font-mono text-[10px]">1HGBH41JXMN109186</code>
              </span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-[#D4622A]">•</span>
              <span>
                <strong className="text-[#F2EDE8]">New Seed (Tesla Y):</strong> Plate <code className="bg-[#222] text-[#F2EDE8] px-1.5 py-0.5 rounded font-mono text-[10px]">9XYZ789</code> or VIN <code className="bg-[#222] text-[#F2EDE8] px-1.5 py-0.5 rounded font-mono text-[10px]">1FTNW20F93EA99999</code>
              </span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-[#D4622A]">•</span>
              <span>
                <strong className="text-[#F2EDE8]">Individual VINs:</strong> Buick (<code className="bg-[#222] text-[#F2EDE8] px-1.5 py-0.5 rounded font-mono text-[10px]">5GAKRCKD7HJ111111</code>) or Lexus (<code className="bg-[#222] text-[#F2EDE8] px-1.5 py-0.5 rounded font-mono text-[10px]">1FTNW20F93EA33333</code>)
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Inline Search Results */}
      {result && result.success && (
        <div className="mt-5 pt-5 border-t border-white/5 flex flex-col gap-3">
          
          {/* Multiple matches selection */}
          {!selectedVehicle && result.vehicles.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4622A]">
                Multiple matches found ({result.vehicles.length})
              </span>
              <p className="text-[11px] text-[#888880] mb-1">
                Select your vehicle to view location and charges:
              </p>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {result.vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVehicle(v)}
                    className="w-full text-left bg-[#111111] hover:bg-[#222222] border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer border-none"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#F2EDE8]">
                        {v.year} {v.make} {v.model}
                      </span>
                      <span className="text-[10px] text-[#888880] font-mono mt-0.5">
                        Plate: {v.plate} | VIN: {v.vin.substring(0, 8)}...
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#D4622A] flex-shrink-0">Select</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single/Selected vehicle details */}
          {selectedVehicle && (
            <div id="printable-receipt" className="flex flex-col gap-5 bg-[#111111] border border-white/5 rounded-2xl p-5 sm:p-6 text-left relative overflow-hidden">
              {/* Optional button to go back to list if there are multiple matches */}
              {result.vehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="self-start text-[10px] font-bold text-[#888880] hover:text-[#F2EDE8] transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1 mb-0.5"
                >
                  &larr; Back to list
                </button>
              )}

              {/* Vehicle identification tag */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#D4622A]" />
                  <span className="text-sm font-bold text-[#F2EDE8] font-['Outfit']">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </span>
                </div>
                {result.vehicles.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(null)}
                    className="text-[10px] font-bold text-[#888880] hover:text-[#F2EDE8] transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1"
                  >
                    &larr; Change vehicle
                  </button>
                ) : (
                  <span className="text-[9px] font-semibold text-[#888880] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">
                    Matched
                  </span>
                )}
              </div>

              {/* Vehicle Specifications Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-[#555550] uppercase tracking-wider block mb-0.5">License Plate</span>
                  <span className="font-semibold text-[#F2EDE8] font-mono">
                    {selectedVehicle.plate || "N/A"} {selectedVehicle.licenseState ? `(${selectedVehicle.licenseState})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#555550] uppercase tracking-wider block mb-0.5">VIN Number</span>
                  <span className="font-semibold text-[#F2EDE8] font-mono select-all">
                    {selectedVehicle.vin || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#555550] uppercase tracking-wider block mb-0.5">Stock Number</span>
                  <span className="font-semibold text-[#F2EDE8] font-mono">
                    {selectedVehicle.stockNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#555550] uppercase tracking-wider block mb-0.5">Color</span>
                  <span className="font-semibold text-[#F2EDE8]">
                    {selectedVehicle.color || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#555550] uppercase tracking-wider block mb-0.5">Status</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4CAF6A] bg-[#4CAF6A]/10 border border-[#4CAF6A]/20 px-2 py-0.5 rounded-md mt-0.5">
                    <span className="w-1.5 h-1.5 bg-[#4CAF6A] rounded-full animate-pulse" />
                    {selectedVehicle.storageStatus || "In Lot"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#555550] uppercase tracking-wider block mb-0.5">Facility</span>
                  <span className="font-semibold text-[#F2EDE8]">
                    {selectedVehicle.storageCompany || "N/A"}
                  </span>
                </div>
              </div>

              {/* Towing Log Section */}
              <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#888880]" />
                  <span className="text-[10px] font-bold text-[#888880] uppercase tracking-widest">Towing & Impound Log</span>
                </div>
                <div className="bg-[#161616] border border-white/5 rounded-xl p-3 flex flex-col gap-2.5 text-xs text-[#888880] leading-relaxed">
                  <div>
                    <span className="font-semibold text-[#F2EDE8]">Tow Reason:</span> {selectedVehicle.towReason || "N/A"} ({selectedVehicle.towType || "Standard Tow"})
                  </div>
                  <div>
                    <span className="font-semibold text-[#F2EDE8]">Towed Location:</span> {selectedVehicle.towedStreet ? `${selectedVehicle.towedStreet}, ${selectedVehicle.towedCityName || ""}, ${selectedVehicle.towedStateName || ""}`.replace(/,\s*$/, '') : "N/A"}
                  </div>
                  <div className="flex justify-between items-center flex-wrap gap-2 text-[11px] pt-1.5 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#D4622A]" />
                      {selectedVehicle.towedDate || "N/A"} at {selectedVehicle.towedTime || "N/A"}
                    </span>
                    <span>
                      Operator: <span className="font-semibold text-[#F2EDE8]">{selectedVehicle.wreckerDriver || "N/A"}</span> ({selectedVehicle.wreckerCompany || "N/A"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Charges Section */}
              <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#888880]" />
                  <span className="text-[10px] font-bold text-[#888880] uppercase tracking-widest">Itemized Charges</span>
                </div>
                <div className="border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#161616] border-b border-white/5">
                        <th className="py-2.5 px-3 font-semibold text-[#888880]">Fee Description</th>
                        <th className="py-2.5 px-3 text-right font-semibold text-[#888880]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[#F2EDE8]">
                      {selectedVehicle.charges && selectedVehicle.charges.length > 0 ? (
                        selectedVehicle.charges.map((charge, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-2.5 px-3 text-left font-sans text-xs text-[#888880]">{charge.towChargesName}</td>
                            <td className="py-2.5 px-3 text-right">{fmt(charge.totalCharges)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-3 px-3 text-[#555550] italic">No charges recorded.</td>
                          <td className="py-3 px-3 text-right">$0.00</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal, tax, discounts, total */}
                <div className="flex flex-col gap-1.5 border border-white/5 bg-[#161616]/50 rounded-xl p-3 text-xs font-mono">
                  <div className="flex justify-between text-[#888880]">
                    <span>Subtotal</span>
                    <span>{fmt(selectedVehicle.subTotal || selectedVehicle.towedBalance)}</span>
                  </div>
                  {selectedVehicle.taxAmount !== undefined && selectedVehicle.taxAmount > 0 && (
                    <div className="flex justify-between text-[#888880]">
                      <span>Tax / City Fees</span>
                      <span>{fmt(selectedVehicle.taxAmount)}</span>
                    </div>
                  )}
                  {selectedVehicle.discountTotal !== undefined && selectedVehicle.discountTotal > 0 && (
                    <div className="flex justify-between text-[#CC6666]">
                      <span>Discounts</span>
                      <span>-{fmt(selectedVehicle.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 mt-1.5 border-t border-white/5">
                    <span className="font-sans text-[11px] font-bold text-[#F2EDE8] uppercase tracking-wider">Total Balance Due</span>
                    <span className="text-xl font-black text-[#4CAF6A]">{fmt(selectedVehicle.towedBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Compliance section */}
              {selectedVehicle.legalDetails && (
                <div className="border-t border-white/5 pt-4">
                  <div className="bg-[#D4622A]/5 border border-[#D4622A]/10 rounded-xl p-3 flex gap-2.5 text-[10px] text-[#888880] leading-relaxed">
                    <Scale className="w-4 h-4 text-[#D4622A] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#F2EDE8] block mb-0.5 uppercase tracking-wider text-[9px]">State Compliance Notice</span>
                      {selectedVehicle.legalDetails}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="border-t border-white/5 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
