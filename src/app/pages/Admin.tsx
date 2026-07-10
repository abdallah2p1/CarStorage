import { useState } from "react";
import { 
  Lock, KeyRound, Building2, Layout, Clock, FileText, 
  Trash2, Plus, Save, CheckCircle2, AlertCircle, Sparkles, HelpCircle,
  Activity, Database, RefreshCw, LogOut, ShieldCheck
} from "lucide-react";
import { AppConfig, BusinessHour } from "../utils/config";
import { toast } from "sonner";
import type { FAQItem } from "../utils/config";

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

  const [docsCardTitle, setDocsCardTitle] = useState(config.documentsCard?.title || "Required Documents");
  const [docsCardIcon, setDocsCardIcon] = useState(config.documentsCard?.icon || "FileText");
  const [docsNotice, setDocsNotice] = useState(config.documentsCard?.notice || "");
  const [hoursCardTitle, setHoursCardTitle] = useState(config.hoursCard?.title || "Business Hours");
  const [hoursCardIcon, setHoursCardIcon] = useState(config.hoursCard?.icon || "Clock");

  // FAQ State
  const [faqs, setFaqs] = useState<FAQItem[]>(config.faqs || []);

  // API Config States
  const [apiMode, setApiMode] = useState(config.api?.mode || "mock");
  const [apiAppID, setApiAppID] = useState(config.api?.appID || "");
  const [adminPin, setAdminPin] = useState(config.api?.adminPin || "1234");

  const [activeTab, setActiveTab] = useState<"analytics" | "profile" | "hero" | "hours" | "docs" | "faq" | "api">("analytics");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [clearingLogs, setClearingLogs] = useState(false);

  // ─── PIN AUTH GATING ───
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (pin === (config.api?.adminPin || "1234")) {
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

  // ─── CLEAR SEARCH LOGS ───
  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all search logs? This cannot be undone.")) return;
    setClearingLogs(true);
    try {
      const res = await fetch("/api/clear-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to clear search logs.");
      }
      onConfigUpdate({
        ...config,
        logs: [],
      });
      toast.success("Search logs cleared successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear logs.");
    } finally {
      setClearingLogs(false);
    }
  };

  // ─── SAVE CONFIG TO SERVER ───
  const handleSaveConfig = async () => {
    if (!adminPin || adminPin.trim().length < 4) {
      toast.error("Admin PIN must be at least 4 characters long.");
      return;
    }

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
      documentsCard: {
        title: docsCardTitle,
        icon: docsCardIcon,
        notice: docsNotice,
      },
      hoursCard: {
        title: hoursCardTitle,
        icon: hoursCardIcon,
      },
      hours,
      requiredDocuments,
      faqs,
      api: {
        mode: apiMode,
        appID: apiAppID,
        adminPin: adminPin.trim(),
      },
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
      // Synchronize the current PIN state so user is not locked out on subsequent POSTs
      setPin(adminPin.trim());
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
            Enter your administration PIN to manage site settings.
          </p>

          <form onSubmit={handleVerifyPin} className="flex flex-col gap-4">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#555550] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••"
                maxLength={16}
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
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 px-4 py-3.5 bg-[#222222] hover:bg-[#2A2A2A] text-[#888880] hover:text-[#F2EDE8] text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border-none"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock Panel</span>
          </button>
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
              { id: "analytics", label: "Analytics", icon: Activity },
              { id: "profile", label: "Profile", icon: Building2 },
              { id: "hero", label: "Hero Page", icon: Layout },
              { id: "hours", label: "Hours", icon: Clock },
              { id: "docs", label: "Documents", icon: FileText },
              { id: "faq", label: "FAQ", icon: HelpCircle },
              { id: "api", label: "API Settings", icon: Database },
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
          
          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-white/5">
                <h2 className="text-sm font-bold text-[#F2EDE8]">
                  Search Logs & Analytics
                </h2>
                {config.logs && config.logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    disabled={clearingLogs}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CC3333]/10 hover:bg-[#CC3333]/20 border border-[#CC3333]/20 text-[#CC6666] hover:text-[#FF8888] disabled:opacity-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Search Logs</span>
                  </button>
                )}
              </div>

              {/* Metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-white/5 rounded-xl p-4.5">
                  <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider block mb-1">
                    Total Lookups
                  </span>
                  <span className="text-2xl font-black text-[#F2EDE8] font-mono">
                    {config.logs ? config.logs.length : 0}
                  </span>
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-xl p-4.5">
                  <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider block mb-1">
                    Successful Matches
                  </span>
                  <span className="text-2xl font-black text-[#4CAF6A] font-mono">
                    {config.logs ? config.logs.filter(l => l.success).length : 0}
                  </span>
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-xl p-4.5">
                  <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider block mb-1">
                    Success Rate
                  </span>
                  <span className="text-2xl font-black text-[#D4622A] font-mono">
                    {config.logs && config.logs.length > 0
                      ? Math.round((config.logs.filter(l => l.success).length / config.logs.length) * 100)
                      : 0}%
                  </span>
                </div>
              </div>

              {/* Logs Table */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                  Recent Search Activity
                </span>
                <div className="border border-white/5 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#111111] border-b border-white/5 text-[#888880] font-semibold">
                        <th className="py-2.5 px-3">Date/Time</th>
                        <th className="py-2.5 px-3">Query</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Result Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {config.logs && config.logs.length > 0 ? (
                        config.logs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.01] transition-colors text-[#F2EDE8]">
                            <td className="py-2.5 px-3 text-[#888880] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold uppercase">{log.query}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                log.success 
                                  ? "text-[#4CAF6A] bg-[#4CAF6A]/10 border border-[#4CAF6A]/20" 
                                  : "text-[#CC6666] bg-[#CC3333]/10 border border-[#CC3333]/20"
                              }`}>
                                {log.success ? "Success" : "Failed"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#888880]">{log.details}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[#888880] italic">
                            No lookups recorded yet. Search queries will show up here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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

            </div>
          )}

          {/* BUSINESS HOURS TAB */}
          {activeTab === "hours" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#F2EDE8] pb-2 border-b border-white/5 mb-2">
                Business Hours Card Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">Card Title</label>
                  <input type="text" value={hoursCardTitle} onChange={(e) => setHoursCardTitle(e.target.value)} className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">Card Icon</label>
                  <select value={hoursCardIcon} onChange={(e) => setHoursCardIcon(e.target.value)} className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 appearance-none">
                    <option value="Clock">Clock</option>
                    <option value="Calendar">Calendar</option>
                    <option value="List">List</option>
                    <option value="Info">Info</option>
                    <option value="FileText">FileText</option>
                  </select>
                </div>
              </div>

              <h2 className="text-sm font-bold text-[#F2EDE8] pb-2 border-b border-white/5 mb-2 mt-2">
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

              <div className="flex flex-col gap-2 mt-4">
                <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                  Retrieval Hours Notice Banner (Optional)
                </label>
                <textarea
                  rows={2}
                  value={hoursNotice}
                  onChange={(e) => setHoursNotice(e.target.value)}
                  placeholder="Leave blank to hide this notice from the card..."
                  className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 resize-none font-sans leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* REQUIRED DOCUMENTS TAB */}
          {activeTab === "docs" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#F2EDE8] pb-3 border-b border-white/5">
                Documents Card Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">Card Title</label>
                  <input type="text" value={docsCardTitle} onChange={(e) => setDocsCardTitle(e.target.value)} className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">Card Icon</label>
                  <select value={docsCardIcon} onChange={(e) => setDocsCardIcon(e.target.value)} className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 appearance-none">
                    <option value="FileText">FileText</option>
                    <option value="ClipboardList">ClipboardList</option>
                    <option value="CheckCircle2">CheckCircle2</option>
                    <option value="Info">Info</option>
                    <option value="Clock">Clock</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                  Documents Notice Banner (Optional)
                </label>
                <textarea
                  rows={2}
                  value={docsNotice}
                  onChange={(e) => setDocsNotice(e.target.value)}
                  placeholder="e.g. Please bring original copies..."
                  className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 resize-none font-sans leading-relaxed"
                />
              </div>

              <h2 className="text-sm font-bold text-[#F2EDE8] pb-3 border-b border-white/5 mt-2">
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

          {/* FAQ TAB */}
          {activeTab === "faq" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#F2EDE8] pb-3 border-b border-white/5 flex justify-between items-center">
                <span>Frequently Asked Questions</span>
                <button
                  type="button"
                  onClick={() =>
                    setFaqs([
                      ...faqs,
                      {
                        id: `id-${faqs.length + 1}`,
                        question: "",
                        answer: "",
                      },
                    ])
                  }
                  className="px-3 py-1.5 bg-[#D4622A]/10 border border-[#D4622A]/20 text-[#D4622A] hover:bg-[#D4622A] hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  Add FAQ
                </button>
              </h2>

              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                {faqs.length === 0 ? (
                  <p className="text-xs text-[#888880] italic text-center py-6">
                    No FAQs configured. Click "Add FAQ" to create one.
                  </p>
                ) : (
                  faqs.map((faq) => (
                    <div key={faq.id} className="bg-[#111111] border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative group">
                      <div className="flex justify-between items-center gap-4">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) =>
                            setFaqs(
                              faqs.map((f) =>
                                f.id === faq.id
                                  ? { ...f, question: e.target.value }
                                  : f
                              )
                            )
                          }
                          placeholder="Question"
                          className="flex-grow bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFaqs(faqs.filter((f) => f.id !== faq.id))
                          }
                          className="p-1 bg-transparent hover:bg-white/5 border-none text-[#888880] hover:text-[#CC3333] transition-colors cursor-pointer rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) =>
                          setFaqs(
                            faqs.map((f) =>
                              f.id === faq.id
                                ? { ...f, answer: e.target.value }
                                : f
                            )
                          )
                        }
                        placeholder="Answer"
                        className="bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 resize-none font-sans leading-relaxed"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* API SETTINGS TAB */}
          {activeTab === "api" && (
            <div className="flex flex-col gap-5">
              <h2 className="text-sm font-bold text-[#F2EDE8] pb-3 border-b border-white/5">
                VTS Cloud API & System Settings
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    API Lookup Mode
                  </label>
                  <select
                    value={apiMode}
                    onChange={(e: any) => setApiMode(e.target.value)}
                    className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 appearance-none cursor-pointer"
                  >
                    <option value="mock">Mock Offline Mode (Uses local presets like COOLDUDE)</option>
                    <option value="dev">Developer Sandbox (CKT Systems Sandbox)</option>
                    <option value="prod">Production Live Mode (myVtsCloud Live API)</option>
                  </select>
                  <p className="text-[10px] text-[#888880] leading-relaxed">
                    Choose <strong>Mock Offline Mode</strong> to test vehicle details in local environments without checking the real VTS servers.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    VTS Application ID (AppID)
                  </label>
                  <input
                    type="text"
                    value={apiAppID}
                    onChange={(e) => setApiAppID(e.target.value)}
                    placeholder="Enter VTS Cloud API App ID key..."
                    className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 font-mono"
                  />
                  <p className="text-[10px] text-[#888880] leading-relaxed">
                    The Application ID key is obtained from your VTS Cloud export portal dashboard.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                    Admin Portal PIN Passcode
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#555550] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={16}
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ""))}
                      className="bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs text-[#F2EDE8] outline-none focus:border-[#D4622A]/50 font-mono tracking-widest font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-[#888880] leading-relaxed">
                    Digit code to authenticate and access this admin panel. Must be at least 4 digits.
                  </p>
                </div>

                {/* API Status Info */}
                <div className="bg-[#111111] border border-white/5 rounded-xl p-4.5 mt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4622A]" />
                    <span className="text-xs font-bold text-[#F2EDE8]">API Connection Status</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#888880] pt-1.5 border-t border-white/5">
                    <span className={`w-2 h-2 rounded-full ${apiMode === "mock" ? "bg-[#4CAF6A]" : "bg-[#D4622A] animate-pulse"}`} />
                    <span>
                      Mode: <strong className="text-[#F2EDE8] uppercase">{apiMode}</strong>
                    </span>
                    <span className="text-[#555550]">|</span>
                    <span>
                      Proxy Server URL: <code className="text-[#888880]">/api/lookup</code>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
