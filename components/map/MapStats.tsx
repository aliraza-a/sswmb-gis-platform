"use client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Building, Layers } from "lucide-react";

interface Props {
  ucName: string;
  vehicleCount: number;
  activeVehicleCount: number;
  compactorCount: number;
  zone: string;
  status: string;
}

const statusStyles: Record<string, string> = {
  in_progress: "border-amber-500/50 text-amber-500",
  complete: "border-emerald-500/50 text-emerald-500",
  pending: "border-border text-muted-foreground",
};

export default function MapStats({
  ucName,
  vehicleCount,
  activeVehicleCount,
  compactorCount,
  zone,
  status,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between"
    >
      {/* Left — UC info */}
      <div className="bg-card/90 backdrop-blur-md border border-border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Layers className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">{ucName}</div>
          <div className="text-xs text-muted-foreground">{zone}</div>
        </div>
        <Badge
          variant="outline"
          className={`ml-2 text-[10px] ${statusStyles[status] || statusStyles.pending}`}
        >
          {status.replace("_", " ")}
        </Badge>
      </div>

      {/* Right — quick stats */}
      <div className="bg-card/90 backdrop-blur-md border border-border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold">{activeVehicleCount}/{vehicleCount}</span>
          <span className="text-xs text-muted-foreground">active</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold">{compactorCount}</span>
          <span className="text-xs text-muted-foreground">Compactors</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-muted-foreground">UC-1 Live</span>
        </div>
      </div>
    </motion.div>
  );
}
