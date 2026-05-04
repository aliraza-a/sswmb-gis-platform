"use client";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Layers, Map as MapIcon, Image as ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export type LayerState = {
  boundary: boolean;
  routes: boolean;
  gts: boolean;
  bins: boolean;
};

interface Props {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
  mapType: "streets" | "satellite";
  onMapTypeChange: (type: "streets" | "satellite") => void;
}

const layerConfig = [
  { key: "boundary" as const, label: "UC Boundary", color: "bg-blue-500" },
  { key: "routes" as const, label: "Routes", color: "bg-amber-500" },
  { key: "gts" as const, label: "Compactors", color: "bg-orange-500" },
  { key: "bins" as const, label: "Bins", color: "bg-emerald-500" },
];

export default function LayerControls({ layers, onToggle, mapType, onMapTypeChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="absolute bottom-6 left-4 z-10 bg-card/90 backdrop-blur-md border border-border rounded-2xl p-4 shadow-xl w-56"
    >
      {/* Style Switcher */}
      <div className="flex items-center gap-2 mb-3">
        <MapIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Map Type
        </span>
      </div>
      
      <div className="flex p-1 bg-accent/50 rounded-xl mb-4">
        <button
          onClick={() => onMapTypeChange("streets")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            mapType === "streets" 
              ? "bg-card shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapIcon className="w-3 h-3" />
          Streets
        </button>
        <button
          onClick={() => onMapTypeChange("satellite")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            mapType === "satellite" 
              ? "bg-card shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          Satellite
        </button>
      </div>

      <Separator className="mb-4 opacity-50" />

      {/* Layer Toggles */}
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Map Layers
        </span>
      </div>
      <div className="space-y-3">
        {layerConfig.map((layer) => (
          <motion.div
            key={layer.key}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${layers[layer.key] ? layer.color : "bg-muted"} transition-colors`}
              />
              <Label className="text-xs cursor-pointer text-muted-foreground">
                {layer.label}
              </Label>
            </div>
            <Switch
              checked={layers[layer.key]}
              onCheckedChange={() => onToggle(layer.key)}
              className="scale-75"
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
