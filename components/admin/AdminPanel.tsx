"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Truck, Route, MapPin, Layers, Search, Command, LayoutDashboard } from "lucide-react";
import OverviewTab from "./tabs/OverviewTab";
import UCTab from "./tabs/UCTab";
import VehiclesTab from "./tabs/VehiclesTab";
import RoutesTab from "./tabs/RoutesTab";
import GTSTab from "./tabs/GTSTab";
import BinsTab from "./tabs/BinsTab";
import CommandPalette from "./CommandPalette";
import { supabase } from "@/lib/supabase";

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "ucs", label: "Union Councils", icon: Building2 },
  { value: "vehicles", label: "Vehicles", icon: Truck },
  { value: "routes", label: "Routes", icon: Route },
  { value: "gts", label: "Compactors", icon: Layers },
  { value: "bins", label: "Bins", icon: MapPin },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase.from("uc").select("status");
      if (data) {
        const complete = data.filter(u => u.status === 'complete').length;
        const total = data.length;
        setStats({ ucs: `${complete}/${total}` });
      }
    }
    fetchStats();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      
      // Tab switching shortcuts (1-5)
      if (!isCommandPaletteOpen && !e.metaKey && !e.ctrlKey) {
        if (e.key === "1") setActiveTab("ucs");
        if (e.key === "2") setActiveTab("vehicles");
        if (e.key === "3") setActiveTab("routes");
        if (e.key === "4") setActiveTab("gts");
        if (e.key === "5") setActiveTab("bins");
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [isCommandPaletteOpen]);

  const handleSelect = (tab: string, id?: string) => {
    setActiveTab(tab);
    setIsCommandPaletteOpen(false);
    // In a future phase, we can use the 'id' to highlight/scroll to the record
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onSelect={handleSelect}
      />

      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            SSWMB GIS
          </div>
          <div className="font-bold text-base flex items-center gap-2">
            Admin Panel
            <Badge variant="outline" className="text-[9px] px-1 h-4">v2.0</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Korangi District
          </div>
        </div>

        {/* Quick Search Trigger */}
        <div className="p-3 px-4">
          <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-accent/40 hover:bg-accent border border-border/50 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Quick search...</span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">K</span>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab, idx) => (
            <motion.button
              key={tab.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.value)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors text-sm ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </div>
              <div className="flex items-center gap-1.5">
                {stats[tab.value] && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.value ? "bg-primary-foreground/20" : "bg-accent"
                  }`}>
                    {stats[tab.value]}
                  </span>
                )}
                <span className="text-[10px] opacity-30 font-mono">[{idx + 1}]</span>
              </div>
            </motion.button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <div className="text-[10px] text-blue-500 font-bold uppercase mb-1">Shortcut Tip</div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Press <span className="font-bold text-foreground">1-5</span> to jump between tabs instantly.
            </p>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 px-2"
          >
            ← Back to Dashboard
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-accent/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8 max-w-7xl mx-auto"
          >
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "ucs" && <UCTab />}
            {activeTab === "vehicles" && <VehiclesTab />}
            {activeTab === "routes" && <RoutesTab />}
            {activeTab === "gts" && <GTSTab />}
            {activeTab === "bins" && <BinsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`px-2 py-0.5 rounded font-medium border ${
      variant === 'outline' ? 'border-border text-muted-foreground' : 'bg-primary border-primary text-primary-foreground'
    } ${className}`}>
      {children}
    </span>
  );
}
