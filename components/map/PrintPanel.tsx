"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Printer,
  X,
  FileText,
  Truck,
  Building,
  MapPin,
  CheckSquare,
} from "lucide-react";

interface PrintPanelProps {
  uc: any;
  vehicles: any[];
  gts: any[];
}

const sections = [
  { key: "uc_info", label: "UC Information", icon: FileText },
  { key: "vehicles", label: "Vehicle List", icon: Truck },
  { key: "gts", label: "GTS / Compactors", icon: Building },
  { key: "map", label: "Map Snapshot", icon: MapPin },
  { key: "checklist", label: "Field Checklist", icon: CheckSquare },
];

export default function PrintPanel({ uc, vehicles, gts }: PrintPanelProps) {
  const [open, setOpen] = useState(false);
  const [included, setIncluded] = useState<Record<string, boolean>>({
    uc_info: true,
    vehicles: true,
    gts: true,
    map: true,
    checklist: false,
  });

  const toggle = (key: string) =>
    setIncluded((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Trigger button — floating on map */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="absolute bottom-6 right-16 z-10 bg-card/90 backdrop-blur-md border border-border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2 hover:bg-accent transition-colors"
      >
        <Printer className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Print Report</span>
      </motion.button>

      {/* Print Panel Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 z-30 w-80 bg-card border-l border-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <div className="font-bold text-base flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Print Report
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Customize what appears on the printout
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* UC Preview */}
              <div className="p-5 border-b border-border bg-accent/30">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  Printing for
                </div>
                <div className="font-bold text-lg">
                  UC-{uc?.uc_number} — {uc?.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {uc?.zone}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {vehicles.length} vehicles · {gts.length} GTS
                  </span>
                </div>
              </div>

              {/* Section toggles */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Include in printout
                </div>
                <div className="space-y-3">
                  {sections.map((s) => (
                    <motion.div
                      key={s.key}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggle(s.key)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        included[s.key]
                          ? "border-blue-500/30 bg-blue-500/5"
                          : "border-border bg-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            included[s.key] ? "bg-blue-500/20" : "bg-muted"
                          }`}
                        >
                          <s.icon
                            className={`w-4 h-4 ${
                              included[s.key]
                                ? "text-blue-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <Switch
                        checked={included[s.key]}
                        onCheckedChange={() => toggle(s.key)}
                        onClick={(e) => e.stopPropagation()}
                        className="scale-75"
                      />
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-5" />

                {/* Print preview summary */}
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Preview summary
                </div>
                <div className="space-y-2 text-sm">
                  {included.uc_info && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>UC Information</span>
                      <span className="text-foreground">1 section</span>
                    </div>
                  )}
                  {included.vehicles && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Vehicles</span>
                      <span className="text-foreground">
                        {vehicles.length} rows
                      </span>
                    </div>
                  )}
                  {included.gts && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>GTS / Compactors</span>
                      <span className="text-foreground">{gts.length} rows</span>
                    </div>
                  )}
                  {included.map && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Map Snapshot</span>
                      <span className="text-foreground">1 page</span>
                    </div>
                  )}
                  {included.checklist && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Field Checklist</span>
                      <span className="text-foreground">1 section</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Print button */}
              <div className="p-5 border-t border-border">
                <Button className="w-full h-11 gap-2" onClick={handlePrint}>
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Use browser print → Save as PDF for best results
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── PRINT STYLESHEET — only visible when printing ── */}
      <div className="hidden print:block" id="print-content">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #print-content, #print-content * { visibility: visible; }
            #print-content { position: fixed; top: 0; left: 0; width: 100%; }
          }
        `}</style>

        {/* Print layout */}
        <div className="p-8 font-sans text-black bg-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
            <div>
              <div className="text-2xl font-bold">
                SSWMB — GIS Mapping Report
              </div>
              <div className="text-gray-500 text-sm mt-1">
                SWEEP Project · Korangi District
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>
                Printed:{" "}
                {new Date().toLocaleDateString("en-PK", { dateStyle: "long" })}
              </div>
              <div>Prepared by: Ali Raza</div>
            </div>
          </div>

          {/* UC Info */}
          {included.uc_info && uc && (
            <div className="mb-6">
              <div className="text-lg font-bold mb-3">
                UC-{uc.uc_number} — {uc.name}
              </div>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    ["Zone", uc.zone],
                    ["Supervisor", uc.supervisor_name || "—"],
                    ["Status", uc.status?.replace("_", " ")],
                    ["Total Vehicles", vehicles.length],
                    ["GTS Units", gts.length],
                  ].map(([k, v]) => (
                    <tr key={k} className="border border-gray-200">
                      <td className="p-2 bg-gray-50 font-medium w-40">{k}</td>
                      <td className="p-2">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vehicles */}
          {included.vehicles && vehicles.length > 0 && (
            <div className="mb-6">
              <div className="text-base font-bold mb-3">Vehicle List</div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {["Reg Number", "Type", "Driver", "Phone", "Shift"].map(
                      (h) => (
                        <th key={h} className="p-2 text-left font-medium">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v, i) => (
                    <tr
                      key={v.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-2 border border-gray-200 font-mono">
                        {v.reg_number}
                      </td>
                      <td className="p-2 border border-gray-200 capitalize">
                        {v.vehicle_type?.replace("_", " ")}
                      </td>
                      <td className="p-2 border border-gray-200">
                        {v.driver_name || "—"}
                      </td>
                      <td className="p-2 border border-gray-200">
                        {v.driver_phone || "—"}
                      </td>
                      <td className="p-2 border border-gray-200">
                        {v.shift || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* GTS */}
          {included.gts && gts.length > 0 && (
            <div className="mb-6">
              <div className="text-base font-bold mb-3">
                GTS / Compactor Units
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {[
                      "Reg Number",
                      "Type",
                      "Capacity",
                      "Location",
                      "Driver",
                    ].map((h) => (
                      <th key={h} className="p-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gts.map((g, i) => (
                    <tr
                      key={g.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-2 border border-gray-200 font-mono">
                        {g.reg_number}
                      </td>
                      <td className="p-2 border border-gray-200">
                        {g.vehicle_type}
                      </td>
                      <td className="p-2 border border-gray-200">
                        {g.capacity_cum} CUM
                      </td>
                      <td className="p-2 border border-gray-200">
                        {g.location_name || "—"}
                      </td>
                      <td className="p-2 border border-gray-200">
                        {g.driver_name || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Checklist */}
          {included.checklist && (
            <div className="mb-6">
              <div className="text-base font-bold mb-3">
                Field Verification Checklist
              </div>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    "UC boundary verified on ground",
                    "All vehicle routes confirmed with supervisor",
                    "Bin locations marked and counted",
                    "GTS / dumping point location confirmed",
                    "Driver details verified",
                    "Shift schedule confirmed",
                  ].map((item, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-2 border border-gray-200 w-8 text-center">
                        ☐
                      </td>
                      <td className="p-2 border border-gray-200">{item}</td>
                      <td className="p-2 border border-gray-200 text-gray-400 text-xs">
                        Verified by: ___________
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-400 flex justify-between">
            <span>SSWMB / SWEEP Project — Korangi District GIS Mapping</span>
            <span>Ali Raza · IT Manager / GIS Mapping Officer</span>
          </div>
        </div>
      </div>
    </>
  );
}
