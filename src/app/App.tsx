import { useState, useEffect } from "react"; // Added useEffect
import Header from "./components/header"; 
import Footer from "./components/footer";
import { getConfig, AppConfig } from "./utils/config"; // Added AppConfig type
import Home from "./pages/Home"; 
import Admin from "./pages/Admin";

type Page = "home" | "search" | "faq" | "admin";

export default function App() {
  // 1. Set up config state (starts as null while fetching from server)
  const [config, setConfig] = useState<AppConfig | null>(null);

  // 2. Set up the active page state
  const [page, setPage] = useState<Page>("home");

  // 3. Set up search results state to store the found vehicle details
  const [searchResults, setSearchResults] = useState<any>(null);

  // 4. Fetch config from server on mount
  useEffect(() => {
    fetch("http://localhost:3001/api/config")
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => {
        setConfig(data);
      })
      .catch((err) => {
        console.warn("Could not load server config, falling back to local:", err);
        setConfig(getConfig()); // Safe local fallback if server is offline
      });
  }, []);

  // 5. URL Path Router & History listener
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      if (path === "/admin") {
        setPage("admin");
      } else if (path === "/search") {
        setPage("search");
      } else if (path === "/faq") {
        setPage("faq");
      } else {
        setPage("home");
      }
    };
    
    // Check path on mount
    handleLocation();

    window.addEventListener("popstate", handleLocation);
    return () => window.removeEventListener("popstate", handleLocation);
  }, []);

  // Helper function to update page state and URL pathname concurrently
  const navigate = (newPage: Page) => {
    setPage(newPage);
    const path = newPage === "home" ? "/" : `/${newPage}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  };

  // Show a loading screen while we wait for the server
  if (!config) {
    return (
      <div className="min-h-screen bg-[#111111] text-[#F2EDE8] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-4 border-white/20 border-t-[#D4622A] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#888880]">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-[#F2EDE8]">
      {/* Navigation Header */}
      <Header page={page} setPage={navigate} config={config} />
      
      {/* Main Viewport */}
      <main className="flex-grow">
        {page === "home" && (
          <Home 
            config={config} 
            onSearchResult={(res) => {
              setSearchResults(res);
              navigate("search"); // Switch to search tab on success
            }} 
            setPage={navigate} 
          />
        )}

        {page === "search" && (
          <div className="p-10 text-center text-[#888880] text-sm">
            Search page placeholder (Results: {searchResults ? "Found vehicle!" : "No search yet"})
          </div>
        )}
        {page === "faq" && (
          <div className="p-10 text-center text-[#888880] text-sm">
            FAQ page placeholder
          </div>
        )}
        {page === "admin" && (
          <Admin 
            config={config} 
            onConfigUpdate={(newConfig) => setConfig(newConfig)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer config={config} setPage={navigate} />
    </div>
  );
}
