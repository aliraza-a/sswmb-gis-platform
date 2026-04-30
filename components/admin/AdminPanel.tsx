"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Truck, Route, MapPin, Layers } from "lucide-react";
import UCTab from "./tabs/UCTab";
import VehiclesTab from "./tabs/VehiclesTab";
import RoutesTab from "./tabs/RoutesTab";
import GTSTab from "./tabs/GTSTab";
import BinsTab from "./tabs/BinsTab";

const tabs = [
  { value: "ucs", label: "Union Councils", icon: Building2 },
  { value: "vehicles", label: "Vehicles", icon: Truck },
  { value: "routes", label: "Routes", icon: Route },
  { value: "gts", label: "Compactors", icon: Layers },
  { value: "bins", label: "Bins", icon: MapPin },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("ucs");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            SSWMB GIS
          </div>
          <div className="font-bold text-base">Admin Panel</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Korangi District
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors text-sm ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </motion.button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <a
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            ← Back to Dashboard
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-8 max-w-6xl mx-auto"
          >
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
