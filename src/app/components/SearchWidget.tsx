import { useState } from "react";
import { AlertCircle, Search, Building2, CreditCard, Car } from "lucide-react";
import { lookupVehicle, LookupApiResponse, TowedVehicleDetails } from "../utils/api";
import { getConfig } from "../utils/config";
import { fmt } from "../utils/constants";

export default function SearchWidget({
  onResults,
  compact,
}: {
  onResults: (res: any) => void;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"plate" | "vin">("plate");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inline search results states
  const [result, setResult] = useState<LookupApiResponse | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<TowedVehicleDetails | null>(null);

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
      const config = getConfig();
      const res = await lookupVehicle(
        config.api.mode,
        config.api.appID,
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
            <div className="flex flex-col gap-3.5 bg-[#111111] border border-white/5 rounded-xl p-4 text-left">
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
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Car className="w-3.5 h-3.5 text-[#888880]" />
                <span className="text-[11px] font-bold text-[#F2EDE8]">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </span>
              </div>

              {/* Storage company */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#D4622A]/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#D4622A]/20">
                  <Building2 className="w-4 h-4 text-[#D4622A]" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#888880] uppercase tracking-wider block mb-0.5">
                    Storage Facility
                  </span>
                  <span className="text-xs font-bold text-[#F2EDE8]">
                    {selectedVehicle.storageCompany || "N/A"}
                  </span>
                </div>
              </div>

              {/* Total Balance */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#4CAF6A]/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#4CAF6A]/20">
                  <CreditCard className="w-4 h-4 text-[#4CAF6A]" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#888880] uppercase tracking-wider block mb-0.5">
                    Total Balance Due
                  </span>
                  <span className="text-2xl font-black text-[#4CAF6A] font-mono leading-none block mt-0.5">
                    {fmt(selectedVehicle.towedBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
