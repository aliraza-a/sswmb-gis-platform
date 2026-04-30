"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Printer,
  X,
  FileText,
  Truck,
  Building,
  MapPin,
  CheckSquare,
  Trash2,
} from "lucide-react";

interface PrintPanelProps {
  uc: any;
  vehicles: any[];
  gts: any[];
  bins: any[];
  mapSnapshot?: string | null; // base64 data URL
  open: boolean;
  onClose: () => void;
}

const VEHICLE_COLORS: Record<string, string> = {
  forland:     "#3B82F6",
  three_wheel: "#A855F7",
  mini_tipper: "#10B981",
  compactor:   "#F97316",
};
const getVehicleColor = (type: string) =>
  VEHICLE_COLORS[type?.toLowerCase()] ?? "#F59E0B";

const sections = [
  { key: "uc_info",  label: "UC Information",     icon: FileText    },
  { key: "map",      label: "Map Snapshot",        icon: MapPin      },
  { key: "vehicles", label: "Vehicle List",        icon: Truck       },
  { key: "gts",      label: "Compactors",    icon: Building    },
  { key: "bins",     label: "Bin Locations",       icon: Trash2      },
  { key: "checklist",label: "Field Checklist",     icon: CheckSquare },
];

export default function PrintPanel({
  uc, vehicles, gts, bins, mapSnapshot, open, onClose,
}: PrintPanelProps) {
  const [included, setIncluded] = useState<Record<string, boolean>>({
    uc_info:   true,
    map:       true,
    vehicles:  true,
    gts:       true,
    bins:      true,
    checklist: false,
  });

  // If no snapshot available, auto-disable map section
  useEffect(() => {
    if (!mapSnapshot) {
      setIncluded(prev => ({ ...prev, map: false }));
    } else {
      setIncluded(prev => ({ ...prev, map: true }));
    }
  }, [mapSnapshot]);

  const toggle = (key: string) =>
    setIncluded((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePrint = () => {
    window.print();
  };

  // Build a deduplicated list of vehicle types present
  const vehicleTypes = Array.from(
    new Set(vehicles.map(v => v.vehicle_type).filter(Boolean))
  );

  return (
    <>
      {/* Print Panel Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
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
                <Button variant="ghost" size="icon" onClick={onClose}>
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
                    {vehicles.length} vehicles · {gts.length} compactors · {bins.length} bins
                  </span>
                </div>
              </div>

              {/* Section toggles */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Include in printout
                </div>
                <div className="space-y-3">
                  {sections.map((s) => {
                    const disabled = s.key === "map" && !mapSnapshot;
                    return (
                      <motion.div
                        key={s.key}
                        whileTap={disabled ? {} : { scale: 0.98 }}
                        onClick={() => !disabled && toggle(s.key)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                          disabled
                            ? "border-border/30 opacity-40 cursor-not-allowed"
                            : included[s.key]
                              ? "border-blue-500/30 bg-blue-500/5 cursor-pointer"
                              : "border-border bg-transparent cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              included[s.key] && !disabled ? "bg-blue-500/20" : "bg-muted"
                            }`}
                          >
                            <s.icon
                              className={`w-4 h-4 ${
                                included[s.key] && !disabled
                                  ? "text-blue-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <span className="text-sm font-medium">{s.label}</span>
                            {s.key === "map" && !mapSnapshot && (
                              <div className="text-[10px] text-muted-foreground">Snapshot unavailable</div>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={included[s.key] && !disabled}
                          onCheckedChange={() => !disabled && toggle(s.key)}
                          onClick={(e) => e.stopPropagation()}
                          className="scale-75"
                          disabled={disabled}
                        />
                      </motion.div>
                    );
                  })}
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
                  {included.map && mapSnapshot && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Map Snapshot</span>
                      <span className="text-foreground">1 page</span>
                    </div>
                  )}
                  {included.vehicles && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Vehicles</span>
                      <span className="text-foreground">{vehicles.length} rows</span>
                    </div>
                  )}
                  {included.gts && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Compactors</span>
                      <span className="text-foreground">{gts.length} rows</span>
                    </div>
                  )}
                  {included.bins && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Bin Locations</span>
                      <span className="text-foreground">{bins.length} rows</span>
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
                    ["Compactor Units", gts.length],
                    ["Bin Locations", bins.length],
                  ].map(([k, v]) => (
                    <tr key={String(k)} className="border border-gray-200">
                      <td className="p-2 bg-gray-50 font-medium w-40">{k}</td>
                      <td className="p-2">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Map Snapshot + Legend */}
          {included.map && mapSnapshot && (
            <div className="mb-6">
              <div className="text-base font-bold mb-3">Map — UC Boundary</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mapSnapshot}
                alt="UC Map Snapshot"
                className="w-full rounded border border-gray-200"
                style={{ maxHeight: 400, objectFit: "cover" }}
              />
              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#10B981" }} />
                  Bin Location
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#F97316" }} />
                  Compactor Station
                </div>
                {vehicleTypes.map(type => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className="inline-block w-6 border-t-2" style={{ borderColor: getVehicleColor(type) }} />
                    {type?.replace("_", " ")}
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-6 border-t-2 border-dashed border-yellow-500" />
                  UC Boundary
                </div>
              </div>
            </div>
          )}

          {/* Vehicles */}
          {included.vehicles && vehicles.length > 0 && (
            <div className="mb-6">
              <div className="text-base font-bold mb-3">Vehicle List</div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {["#", "Reg Number", "Type", "Driver", "Phone", "Shift"].map(
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
                      <td className="p-2 border border-gray-200 text-gray-400 text-xs">{i + 1}</td>
                      <td className="p-2 border border-gray-200 font-mono">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                          style={{ background: getVehicleColor(v.vehicle_type) }}
                        />
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
                Compactor Units
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {[
                      "#",
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
                      <td className="p-2 border border-gray-200 text-gray-400 text-xs">{i + 1}</td>
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

          {/* Bins */}
          {included.bins && bins.length > 0 && (
            <div className="mb-6">
              <div className="text-base font-bold mb-3">Bin Locations</div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {["#", "Bin Type", "Latitude", "Longitude", "Notes"].map(
                      (h) => (
                        <th key={h} className="p-2 text-left font-medium">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bins.map((b, i) => (
                    <tr
                      key={b.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-2 border border-gray-200 text-gray-400 text-xs">{i + 1}</td>
                      <td className="p-2 border border-gray-200 capitalize">
                        {b.bin_type || "Waste Bin"}
                      </td>
                      <td className="p-2 border border-gray-200 font-mono text-xs">
                        {b.latitude?.toFixed(6) ?? "—"}
                      </td>
                      <td className="p-2 border border-gray-200 font-mono text-xs">
                        {b.longitude?.toFixed(6) ?? "—"}
                      </td>
                      <td className="p-2 border border-gray-200 text-gray-500">
                        {b.notes || "—"}
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
                    "Compactor / dumping point location confirmed",
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
