"use client";
import { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Map, { NavigationControl, Source, Layer, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import DrawControl from "./DrawControl";
import { useTheme } from "next-themes";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { drawStyles } from "@/lib/map-draw-styles";
import { AlertTriangle, Clock, Layers } from "lucide-react";
import * as turf from "@turf/turf";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface BoundaryMapInputProps {
  initialGeoJSON?: any;
  referenceGeoJSON?: any; // New prop for background reference layers
  isDraft?: boolean;
  onDraftChange?: (isDraft: boolean) => void;
  onOverlap?: (hasOverlap: boolean) => void;
  onChange: (geojson: any) => void;
}

export default function BoundaryMapInput({ 
  initialGeoJSON, 
  referenceGeoJSON, 
  isDraft = false,
  onDraftChange,
  onOverlap,
  onChange 
}: BoundaryMapInputProps) {
  const { theme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
  const [hasOverlap, setHasOverlap] = useState(false);

  const mapStyle = mapType === "satellite"
    ? "mapbox://styles/mapbox/satellite-streets-v11"
    : theme === "dark" 
      ? "mapbox://styles/mapbox/dark-v11" 
      : "mapbox://styles/mapbox/streets-v11";

  const onUpdate = useCallback(() => {
    if (drawRef.current) {
      const data = drawRef.current.getAll();
      onChange(data);

      // Spatial Validation: Check for overlaps with referenceGeoJSON
      if (referenceGeoJSON && referenceGeoJSON.features && data.features.length > 0) {
        let overlapFound = false;
        try {
          const currentFeature = data.features[0]; // Assuming single feature for now
          for (const refFeature of referenceGeoJSON.features) {
            const intersection = turf.intersect(currentFeature, refFeature);
            if (intersection) {
              overlapFound = true;
              break;
            }
          }
        } catch (e) {
          console.error("Overlap check failed", e);
        }
        setHasOverlap(overlapFound);
        onOverlap?.(overlapFound);
      }
    }
  }, [onChange, referenceGeoJSON, onOverlap]);

  // Load initial data once draw control is ready
  const onDrawLoaded = useCallback((draw: MapboxDraw) => {
    drawRef.current = draw;
    if (initialGeoJSON) {
      // If it's a FeatureCollection, we can add it directly
      if (initialGeoJSON.type === "FeatureCollection") {
        draw.add(initialGeoJSON);
      } else {
        // Otherwise wrap it in a feature
        draw.add({
          type: "Feature",
          properties: {},
          geometry: initialGeoJSON
        } as any);
      }
    }
  }, [initialGeoJSON]);

  // Calculate center of initialGeoJSON or referenceGeoJSON if provided
  const targetForCenter = initialGeoJSON || referenceGeoJSON;

  useEffect(() => {
    if (mapRef.current && targetForCenter) {
      try {
        const bbox = turf.bbox(targetForCenter);
        mapRef.current.fitBounds(
          [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
          { padding: 40, duration: 1000 }
        );
      } catch (e) {
        // ignore
      }
    }
  }, [targetForCenter]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-border relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 67.1855,
          latitude: 24.8918,
          zoom: 11
        }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />
        
        {/* Reference Layers (Other boundaries for context) */}
        {referenceGeoJSON && (
          <Source id="reference-source" type="geojson" data={referenceGeoJSON}>
            <Layer
              id="reference-fill"
              type="fill"
              paint={{
                "fill-color": "#64748b",
                "fill-opacity": 0.1
              }}
            />
            <Layer
              id="reference-line"
              type="line"
              paint={{
                "line-color": "#64748b",
                "line-width": 1,
                "line-dasharray": [2, 2]
              }}
            />
          </Source>
        )}

        {/* Overlap Warning */}
        <AnimatePresence>
          {hasOverlap && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold"
            >
              <AlertTriangle className="w-4 h-4" />
              Boundary Overlap Detected!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Style & Draft Switcher Overlay */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <div className="flex bg-card/90 backdrop-blur-md border border-border rounded-lg p-0.5 shadow-md">
            <button
              onClick={() => setMapType("streets")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                mapType === "streets" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setMapType("satellite")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                mapType === "satellite" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Satellite
            </button>
          </div>

          <button
            onClick={() => onDraftChange?.(!isDraft)}
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all shadow-md ${
              isDraft 
                ? "bg-amber-500 text-white border-amber-600" 
                : "bg-card/90 backdrop-blur-md text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {isDraft ? <Clock className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
            {isDraft ? "DRAFT MODE" : "MARK AS DRAFT"}
          </button>
        </div>

        <DrawControl
          position="top-left"
          displayControlsDefault={false}
          controls={{
            polygon: true,
            trash: true
          }}
          defaultMode="simple_select"
          onCreate={onUpdate}
          onUpdate={onUpdate}
          onDelete={onUpdate}
          onDrawControlLoaded={onDrawLoaded}
          styles={drawStyles}
        />
      </Map>
    </div>
  );
}
