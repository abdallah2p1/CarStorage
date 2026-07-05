import { Car, MapPin, Phone } from "lucide-react";
import { AppConfig } from "../utils/config";

type Page = "home" | "search" | "faq" | "admin";

export default function Footer({
  config,
  setPage,
}: {
  config: AppConfig;
  setPage: (p: Page) => void;
}) {
  return (
    <footer className="border-t-2 border-[#D4622A] bg-[#0A0A0A] mt-auto">
      <div className="max-w-[1100px] mx-auto px-6 py-10 flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7.5 h-7.5 bg-[#D4622A] rounded-lg flex items-center justify-center">
            <Car className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="block font-['Outfit'] font-bold text-sm text-[#F2EDE8]">
              {config.company.name}
            </span>
            <span className="block text-[11px] text-[#555550]">
              CA Tow #{config.company.towLicense} · CA Storage #{config.company.storageLicense}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="w-3.5 h-3.5 text-[#D4622A] mt-0.5" />
          <div className="text-xs text-[#888880] leading-relaxed">
            <p>{config.company.address.split(",")[0]}</p>
            <p>{config.company.address.split(",").slice(1).join(",").trim()}</p>
          </div>
        </div>

        <a
          href={`tel:${config.company.phone.replace(/\D/g, "")}`} 
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#D4622A] hover:bg-[#C25828] text-white text-xs font-bold rounded-xl no-underline transition-colors duration-150"
        >
          <Phone className="w-3.5 h-3.5" />
          {config.company.phone}
        </a>
      </div>
      <div className="border-t border-white/5 max-w-[1100px] mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-3 text-xs text-[#555550]">
        <p>© {new Date().getFullYear()} {config.company.name}. All rights reserved.</p>
        <div className="flex gap-4.5">
          {(["home", "search", "faq"] as Page[]).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="bg-transparent border-none text-[12px] text-[#555550] hover:text-[#F2EDE8] cursor-pointer capitalize"
            >
              {p === "faq" ? "FAQ" : p}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
