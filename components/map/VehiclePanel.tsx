"use client";
import { motion } from "framer-motion";
import { Truck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VehiclePanelProps {
  vehicles: any[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string | null) => void;
}

const typeColors: Record<string, string> = {
  forland: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  three_wheel: "border-purple-500/40 text-purple-400 bg-purple-500/10",
  mini_tipper: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  compactor: "border-amber-500/40 text-amber-400 bg-amber-500/10",
};

export default function VehiclePanel({ vehicles, selectedVehicleId, onSelectVehicle }: VehiclePanelProps) {
  if (vehicles.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute top-20 right-4 z-10 w-80 bg-card/90 backdrop-blur-md border border-border rounded-2xl shadow-xl flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden"
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold">Vehicles ({vehicles.length})</span>
        </div>
        {selectedVehicleId && (
          <button
            onClick={() => onSelectVehicle(null)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Clear <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {vehicles.map((v) => {
          const isSelected = selectedVehicleId === v.id;
          return (
            <motion.div
              key={v.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectVehicle(isSelected ? null : v.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-border/50 bg-card/40 hover:bg-accent/40 hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-sm tracking-tight">{v.reg_number}</span>
                <Badge variant="outline" className={`text-[10px] py-0 h-4 px-1.5 ${typeColors[v.vehicle_type] || ""}`}>
                  {v.vehicle_type?.replace("_", " ") || "Vehicle"}
                </Badge>
              </div>
              <div className="flex flex-col gap-0.5">
                {v.driver_name && (
                  <span className="text-xs text-muted-foreground truncate">
                    Driver: <span className="text-foreground/80">{v.driver_name}</span>
                  </span>
                )}
                {v.shift && (
                  <span className="text-xs text-muted-foreground">
                    Shift: <span className="text-foreground/80 capitalize">{v.shift}</span>
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
