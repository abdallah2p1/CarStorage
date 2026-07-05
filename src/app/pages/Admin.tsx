import { useState } from "react";
import { 
  Lock, KeyRound, Building2, Layout, Clock, FileText, 
  Trash2, Plus, Save, CheckCircle2, AlertCircle, Sparkles
} from "lucide-react";
import { AppConfig, BusinessHour } from "../utils/config";
import { toast } from "sonner";

export default function Admin({
  config,
  onConfigUpdate,
}: {
  config: AppConfig;
  onConfigUpdate: (newConfig: AppConfig) => void;
}) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // CMS Form States (Initialized from config)
  const [name, setName] = useState(config.company.name);
  const [logoText, setLogoText] = useState(config.company.logoText || config.company.name);
  const [phone, setPhone] = useState(config.company.phone);
  const [address, setAddress] = useState(config.company.address);
  const [towLicense, setTowLicense] = useState(config.company.towLicense);
  const [storageLicense, setStorageLicense] = useState(config.company.storageLicense);

  const [heroTitle, setHeroTitle] = useState(config.company.heroTitle || "Find your towed vehicle.");
  const [heroSubtitle, setHeroSubtitle] = useState(config.company.heroSubtitle || "");
  const [hoursNotice, setHoursNotice] = useState(config.company.hoursNotice);

  const [hours, setHours] = useState<BusinessHour[]>(config.hours);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(config.requiredDocuments);
  const [newDocText, setNewDocText] = useState("");

  const [activeTab, setActiveTab] = useState<"profile" | "hero" | "hours" | "docs">("profile");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ─── PIN AUTH GATING ───
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (pin === (config.api?.adminPin)) {
      setIsAuthenticated(true);
    } else {
      setPinError("Invalid Admin PIN. Please try again.");
    }
  };

  // ─── DOCUMENT MANAGERS ───
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = newDocText.trim();
    if (!doc) return;
    if (requiredDocuments.includes(doc)) {
      toast.error("Document type already exists.");
      return;
    }
    setRequiredDocuments([...requiredDocuments, doc]);
    setNewDocText("");
  };

  const handleDeleteDocument = (docToDelete: string) => {
    setRequiredDocuments(requiredDocuments.filter((d) => d !== docToDelete));
  };

  // ─── BUSINESS HOURS UPDATER ───
  const handleUpdateHour = (day: string, field: keyof BusinessHour, value: any) => {
    setHours(
      hours.map((h) => (h.day === day ? { ...h, [field]: value } : h))
    );
  };

  // ─── SAVE CONFIG TO SERVER ───
  const handleSaveConfig = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const updatedConfig: AppConfig = {
      ...config,
      company: {
        name,
        phone,
        address,
        towLicense,
        storageLicense,
        hoursNotice,
        logoText,
        heroTitle,
        heroSubtitle,
      },
      hours,
      requiredDocuments,
    };

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pin, // Admin pin for server validation
          newConfig: updatedConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save configuration settings.");
      }

      setSaveSuccess(true);
      onConfigUpdate(updatedConfig);
      toast.success("Configurations updated successfully!");
      
      // Auto-clear success banner after 4s
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || "An error occurred while saving.");
      toast.error(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // ─── VIEW 1: PIN AUTH GATE ───
  if (!isAuthenticated) {
    return (
      <div className="max-w-[400px] mx-auto px-6 py-24 text-left">
        <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-8 text-center shadow-xl">
          <div className="w-14 h-14 bg-[#D4622A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#D4622A]/20">
            <Lock className="w-6 h-6 text-[#D4622A]" />
          </div>
          
          <h2 className="font-['Outfit'] font-black text-2xl text-[#F2EDE8] tracking-tight mb-2">
            Admin Portal
          </h2>
          <p className="text-xs text-[#888880] mb-6">
            Enter your 4-digit administration PIN to manage site settings.
          </p>

          <form onSubmit={handleVerifyPin} className="flex flex-col gap-4">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#555550] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setPinError(null);
                }}
                className="w-full bg-[#111111] border border-white/5 rounded-xl pl-11 pr-5 py-3.5 font-mono text-xl tracking-widest text-[#F2EDE8] placeholder-[#555550] focus:border-[#D4622A]/50 outline-none text-center"
                autoFocus
              />
            </div>

            {pinError && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#CC3333]/10 border border-[#CC3333]/20 rounded-lg text-[#CC6666] text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {pinError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D4622A] hover:bg-[#C25828] text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-none"
            >
              Verify PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── VIEW 2: CMS EDITOR PANEL ───
  return (
    <div className="max-w-[860px] mx-auto px-6 py-12 text-left">
      
      {/* CMS Dashboard Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#D4622A]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4622A]">
              CMS Administration
            </span>
          </div>
          <h1 className="font-['Outfit'] font-black text-3xl sm:text-4xl text-[#F2EDE8] tracking-tight">
            Dashboard Editor
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3.5 bg-[#D4622A] hover:bg-[#C25828] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-none shadow-lg shadow-[#D4622A]/10"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Save status alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-[#4CAF6A]/10 border border-[#4CAF6A]/20 rounded-xl text-[#6EC084] text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#4CAF6A]" />
          Configurations saved successfully! Reloading site settings...
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-[#CC3333]/10 border border-[#CC3333]/20 rounded-xl text-[#CC6666] text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#CC3333]" />
          Save Error: {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Tabs Sidebar */}
        <div className="flex flex-row md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 md:col-span-1 border-b md:border-b-0 md:border-r border-white/5 pr-0 md:pr-4">
          {(
            [
              { id: "profile", label: "Profile", icon: Building2 },
              { id: "hero", label: "Hero Page", icon: Layout },
              { id: "hours", label: "Hours", icon: Clock },
              { id: "docs", label: "Documents", icon: FileText },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  active 
                    ? "bg-[#D4622A]/10 text-[#D4622A] border border-[#D4622A]/20" 
                    : "bg-transparent text-[#888880] hover:text-[#F2EDE8] hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configurations Form Box */}
        <div className="md:col-span-3 bg-[#1A1A1A] border border-white/5 rounded-[20px] p-6 sm:p-8">
          
          {/* PROFILE & CONTACT TAB */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-5">
              <h2 className="text-sm font-bold text-[#F2EDE8] pb-3 border-b border-white/5">
                Company Details & Branding
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    Navigation Logo Text
                  </label>
                  <input
                    type="text"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    Location Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    Towing License #
                  </label>
                  <input
                    type="text"
                    value={towLicense}
                    onChange={(e) => setTowLicense(e.target.value)}
                    className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    Storage License #
                  </label>
                  <input
                    type="text"
                    value={storageLicense}
                    onChange={(e) => setStorageLicense(e.target.value)}
                    className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* HERO SECTION TAB */}
          {activeTab === "hero" && (
            <div className="flex flex-col gap-5">
              <h2 className="text-sm font-bold text-[#F2EDE8] pb-3 border-b border-white/5">
                Hero Headers & Banners
              </h2>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                  Hero Title Header
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                  Hero Subtitle Caption
                </label>
                <textarea
                  rows={3}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                  Retrieval Hours Notice Banner
                </label>
                <textarea
                  rows={2}
                  value={hoursNotice}
                  onChange={(e) => setHoursNotice(e.target.value)}
                  className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 resize-none font-sans leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* BUSINESS HOURS TAB */}
          {activeTab === "hours" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#F2EDE8] pb-2 border-b border-white/5 mb-2">
                Weekly Business Hours
              </h2>

              <div className="flex flex-col gap-2.5">
                {hours.map((h) => (
                  <div 
                    key={h.day} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-[#111111] border border-white/5 rounded-xl"
                  >
                    <span className="text-xs font-bold text-[#F2EDE8] w-24 text-left">
                      {h.day}
                    </span>

                    <div className="flex items-center gap-4 flex-grow justify-start sm:justify-end">
                      {/* Closed toggle */}
                      <label className="flex items-center gap-2 text-xs text-[#888880] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={h.closed}
                          onChange={(e) => handleUpdateHour(h.day, "closed", e.target.checked)}
                          className="w-4 h-4 rounded accent-[#D4622A]"
                        />
                        <span>Closed</span>
                      </label>

                      {/* Open time */}
                      <input
                        type="text"
                        disabled={h.closed}
                        value={h.open}
                        onChange={(e) => handleUpdateHour(h.day, "open", e.target.value)}
                        placeholder="08:00 AM"
                        className="bg-[#1A1A1A] border border-white/5 disabled:opacity-30 rounded-lg px-2.5 py-1.5 text-center text-xs font-mono text-[#F2EDE8] outline-none w-24"
                      />

                      <span className="text-[#555550] text-xs">—</span>

                      {/* Close time */}
                      <input
                        type="text"
                        disabled={h.closed}
                        value={h.close}
                        onChange={(e) => handleUpdateHour(h.day, "close", e.target.value)}
                        placeholder="05:00 PM"
                        className="bg-[#1A1A1A] border border-white/5 disabled:opacity-30 rounded-lg px-2.5 py-1.5 text-center text-xs font-mono text-[#F2EDE8] outline-none w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REQUIRED DOCUMENTS TAB */}
          {activeTab === "docs" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#F2EDE8] pb-3 border-b border-white/5">
                Required Documents Checklist
              </h2>

              {/* Add document form */}
              <form onSubmit={handleAddDocument} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Current Vehicle Registration"
                  value={newDocText}
                  onChange={(e) => setNewDocText(e.target.value)}
                  className="flex-grow bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                />
                <button
                  type="submit"
                  className="px-4 bg-[#D4622A]/10 border border-[#D4622A]/20 text-[#D4622A] hover:bg-[#D4622A] hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </form>

              {/* Documents list */}
              <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                {requiredDocuments.length === 0 ? (
                  <p className="text-xs text-[#888880] italic text-center py-6">
                    No required documents configured.
                  </p>
                ) : (
                  requiredDocuments.map((doc) => (
                    <div 
                      key={doc} 
                      className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-[#F2EDE8] gap-4"
                    >
                      <span className="leading-relaxed">{doc}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc)}
                        className="p-1 bg-transparent hover:bg-white/5 border-none text-[#888880] hover:text-[#CC3333] transition-colors cursor-pointer rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
