"use client";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Layers } from "lucide-react";

export type LayerState = {
  boundary: boolean;
  routes: boolean;
  gts: boolean;
  bins: boolean;
};

interface Props {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
}

const layerConfig = [
  { key: "boundary" as const, label: "UC Boundary", color: "bg-blue-500" },
  { key: "routes" as const, label: "Routes", color: "bg-amber-500" },
  { key: "gts" as const, label: "Compactors", color: "bg-orange-500" },
  { key: "bins" as const, label: "Bins", color: "bg-emerald-500" },
];

export default function LayerControls({ layers, onToggle }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="absolute bottom-6 left-4 z-10 bg-card/90 backdrop-blur-md border border-border rounded-2xl p-4 shadow-xl w-56"
    >
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
