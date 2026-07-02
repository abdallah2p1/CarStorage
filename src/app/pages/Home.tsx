import { CheckCircle2, Clock, FileText } from "lucide-react";
import { AppConfig } from "../utils/config";
import SearchWidget from "../components/SearchWidget"; // We will build/connect this next!

export default function Home({
  config,
  onSearchResult,
  setPage,
}: {
  config: AppConfig;
  onSearchResult: (res: any) => void;
  setPage: (p: any) => void;
}) {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <div className="max-w-[580px] mx-auto px-6 py-16 text-center">
        <p className="text-[10px] font-bold tracking-widest text-[#D4622A] uppercase mb-4">
          {config.company.name} · {config.company.address.split(",")[1]?.trim() || "CA"}
        </p>
        <h1 className="font-['Outfit'] font-black text-4xl sm:text-5xl md:text-6xl text-[#F2EDE8] tracking-tight leading-none mb-4 whitespace-pre-line">
          {config.company.heroTitle || "Find your\ntowed vehicle."}
        </h1>
        <p className="text-sm text-[#888880] leading-relaxed mb-10 max-w-[380px] mx-auto">
          {config.company.heroSubtitle || "Enter your license plate or VIN to check if your vehicle is in our facility and see outstanding charges."}
        </p>
        
        {/* Render SearchWidget */}
        <SearchWidget onResults={(res) => {
          if (res) {
            onSearchResult(res);
            setPage("search");
          }
        }} />
      </div>

      {/* Decorative Divider */}
      <div className="max-w-[900px] mx-auto px-6 w-full">
        <div className="border-t border-white/5" />
      </div>

      {/* 2. Documents & Hours Information Grid */}
      <div className="max-w-[900px] mx-auto px-6 py-14 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          
          {/* Required Documents Checklist Card */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-7">
            <div className="flex items-center gap-2.5 mb-5.5">
              <div className="w-8.5 h-8.5 bg-[#222] rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#D4622A]" />
              </div>
              <span className="text-xs font-bold text-[#F2EDE8]">Required Documents</span>
            </div>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {config.requiredDocuments.map((doc) => (
                <li key={doc} className="flex items-start gap-2.5 text-xs text-[#888880] leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-[#D4622A] mt-0.5 flex-shrink-0" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Hours Card */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-7">
            <div className="flex items-center gap-2.5 mb-5.5">
              <div className="w-8.5 h-8.5 bg-[#222] rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#D4622A]" />
              </div>
              <span className="text-xs font-bold text-[#F2EDE8]">Business Hours</span>
            </div>
            <div className="flex flex-col">
              {config.hours.map(({ day, open, close, closed }) => (
                <div key={day} className="flex justify-between items-center py-3 border-b border-white/5 text-xs text-[#888880]">
                  <span>{day}</span>
                  <span className={`font-mono text-[11px] font-semibold ${!closed ? "text-[#F2EDE8]" : "text-[#CC3333]"}`}>
                    {closed ? "Closed" : `${open} – ${close}`}
                  </span>
                </div>
              ))}
            </div>
            {config.company.hoursNotice && (
              <div className="mt-4 p-3.5 bg-[#111111] border-l-2 border-[#D4622A] rounded-r-lg text-[11px] text-[#888880] leading-relaxed">
                {config.company.hoursNotice}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
