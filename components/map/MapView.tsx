"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Map, { Source, Layer, Popup, NavigationControl, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/lib/supabase";
import LayerControls, { LayerState } from "./LayerControls";
import MapStats from "./MapStats";
import PrintPanel from "./PrintPanel";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { X, Truck, Building2, MapPin, Route, Printer } from "lucide-react";
import * as turf from "@turf/turf";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Color per vehicle type
const VEHICLE_COLORS: Record<string, string> = {
  forland:     "#3B82F6", // blue
  three_wheel: "#A855F7", // purple
  mini_tipper: "#10B981", // emerald
  compactor:   "#F97316", // orange
};
const DEFAULT_ROUTE_COLOR = "#F59E0B";

const getVehicleColor = (type: string) =>
  VEHICLE_COLORS[type?.toLowerCase()] ?? DEFAULT_ROUTE_COLOR;

interface PopupInfo {
  longitude: number;
  latitude: number;
  title: string;
  subtitle?: string;
}

function extractGeometry(geojson: any) {
  if (!geojson) return null;
  if (geojson.type === "FeatureCollection" && geojson.features?.length > 0)
    return geojson.features[0].geometry;
  if (geojson.type === "Feature") return geojson.geometry;
  if (geojson.coordinates) return geojson;
  return null;
}

const statusBadgeStyle: Record<string, string> = {
  pending:     "border-border text-muted-foreground",
  in_progress: "border-amber-500/50 text-amber-500",
  complete:    "border-emerald-500/50 text-emerald-500",
};

export default function MapView() {
  const { theme }       = useTheme();
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const currentUc       = parseInt(searchParams.get("uc") || "1", 10);
  const mapRef          = useRef<MapRef>(null);

  const [uc, setUc]                           = useState<any>(null);
  const [boundary, setBoundary]               = useState<any>(null);
  const [vehicles, setVehicles]               = useState<any[]>([]);
  const [gts, setGts]                         = useState<any[]>([]);
  const [routes, setRoutes]                   = useState<any[]>([]);
  const [bins, setBins]                       = useState<any[]>([]);
  const [areaBoundaries, setAreaBoundaries]   = useState<any[]>([]);
  const [popup, setPopup]                     = useState<PopupInfo | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null); // For Area Highlight
  const [focusedVehicleId, setFocusedVehicleId]   = useState<string | null>(null); // For Route Highlight
  const [detailPanel, setDetailPanel]         = useState<any | null>(null);
  const [printOpen, setPrintOpen]             = useState(false);
  const [mapSnapshot, setMapSnapshot]         = useState<string | null>(null);
  const [layers, setLayers]                   = useState<LayerState>({
    boundary: true, routes: true, gts: true, bins: true,
  });
  const [mapType, setMapType]                 = useState<"streets" | "satellite">("streets");

  const mapStyle = mapType === "satellite"
    ? "mapbox://styles/mapbox/satellite-streets-v11"
    : theme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v11";

  const toggle = (key: keyof LayerState) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const openPrintPanel = useCallback(() => {
    // Capture current map canvas as a PNG data URL
    try {
      const canvas = mapRef.current?.getCanvas();
      if (canvas) {
        setMapSnapshot(canvas.toDataURL("image/png"));
      } else {
        setMapSnapshot(null);
      }
    } catch {
      setMapSnapshot(null);
    }
    setPrintOpen(true);
  }, []);

  const zoomToBoundary = useCallback((geojson: any) => {
    if (!mapRef.current || !geojson) return;
    try {
      const bbox = turf.bbox(geojson);
      mapRef.current.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        { padding: 100, duration: 800 }
      );
    } catch {}
  }, []);

  useEffect(() => {
    async function fetchAll() {
      // All boundaries — colored by status
      const { data: allBoundariesData } = await supabase
        .from("uc_boundary")
        .select("uc_id, geojson, uc(uc_number, status)");

      const features = (allBoundariesData || [])
        .map((b: any) => {
          const geom = extractGeometry(b.geojson);
          if (!geom) return null;
          return {
            type: "Feature",
            geometry: geom,
            properties: {
              uc_id:     b.uc_id,
              uc_number: b.uc?.uc_number,
              status:    b.uc?.status || "pending",
              is_active: b.uc?.uc_number === currentUc,
            },
          };
        })
        .filter(Boolean);

      setBoundary({ type: "FeatureCollection", features });

      const activeFeat = features.find((f: any) => f.properties.is_active);
      if (activeFeat) setTimeout(() => zoomToBoundary(activeFeat), 400);

      // Active UC
      const { data: ucData } = await supabase
        .from("uc").select("*").eq("uc_number", currentUc).single();

      if (!ucData) {
        setUc(null); setVehicles([]); setGts([]);
        setRoutes([]); setBins([]); return;
      }
      setUc(ucData);

      const [
        { data: vehicleData },
        { data: gtsUcData },
        { data: routeData },
        { data: binData },
      ] = await Promise.all([
        supabase.from("vehicle").select("*").eq("uc_id", ucData.id),
        supabase.from("gts_uc").select("gts_id").eq("uc_id", ucData.id),
        supabase.from("route")
          .select("*, vehicle(reg_number, vehicle_type, driver_name, driver_phone, shift)")
          .eq("uc_id", ucData.id),
        supabase.from("bin").select("*").eq("uc_id", ucData.id),
      ]);

      setVehicles(vehicleData || []);
      setRoutes(routeData || []);
      setBins(binData || []);

      // Fetch Area Boundaries
      const { data: areaData } = await supabase
        .from("vehicle_boundary")
        .select("*, vehicle(reg_number, vehicle_type)")
        .in("vehicle_id", (vehicleData || []).map(v => v.id));
      setAreaBoundaries(areaData || []);

      if (gtsUcData?.length) {
        const gtsIds = gtsUcData.map(g => g.gts_id);
        const [
          { data: gtsData },
          { data: allGtsUcData }
        ] = await Promise.all([
          supabase.from("gts").select("*").in("id", gtsIds),
          supabase.from("gts_uc")
            .select("gts_id, uc(uc_number)")
            .in("gts_id", gtsIds)
        ]);

        const enrichedGts = (gtsData || []).map(g => ({
          ...g,
          served_ucs: (allGtsUcData || [])
            .filter(au => au.gts_id === g.id)
            .map(au => (au.uc as any)?.uc_number)
            .filter(Boolean)
            .sort((a, b) => a - b)
        }));

        setGts(enrichedGts);
      } else {
        setGts([]);
      }
    }

    fetchAll();
    setSelectedVehicleId(null);
    setDetailPanel(null);
  }, [currentUc, zoomToBoundary]);

  useEffect(() => {
    const vid = searchParams.get("vehicle");
    setSelectedVehicleId(vid);

    if (vid) {
      // Priority 1: Zoom to Area Boundary (Polygon)
      const ab = areaBoundaries.find(b => b.vehicle_id === vid);
      if (ab) {
        zoomToBoundary(ab.geojson);
        return;
      }
      
      // Priority 2: Zoom to Route (LineString)
      const rt = routes.find(r => r.vehicle_id === vid);
      if (rt) {
        zoomToBoundary(rt.geojson);
      }
    }
  }, [searchParams, areaBoundaries, routes, zoomToBoundary]);

  // Build route GeoJSON — each feature carries its color
  const allRouteFeatures = routes
    .filter(r => r.geojson)
    .map(r => {
      const geom = extractGeometry(r.geojson);
      if (!geom) return null;
      const v = r.vehicle || {};
      const color = getVehicleColor(v.vehicle_type);
      return {
        type: "Feature",
        geometry: geom,
        properties: {
          vehicle_id: r.vehicle_id,
          color,
          title:    v.reg_number || "Route",
          subtitle: [
            v.driver_name ? `Driver: ${v.driver_name}` : null,
            v.vehicle_type?.replace("_", " "),
          ].filter(Boolean).join(" • "),
        },
      };
    })
    .filter(Boolean);

  const selectedRoutes = {
    type: "FeatureCollection",
    features: focusedVehicleId
      ? allRouteFeatures.filter((r: any) => r.properties.vehicle_id === focusedVehicleId)
      : [],
  };

  const unselectedRoutes = {
    type: "FeatureCollection",
    features: focusedVehicleId
      ? allRouteFeatures.filter((r: any) => r.properties.vehicle_id !== focusedVehicleId)
      : allRouteFeatures,
  };

  const areaLabelsGeoJSON = {
    type: "FeatureCollection",
    features: routes.filter(r => r.geojson).map(r => {
      const geom = extractGeometry(r.geojson);
      if (!geom) return null;
      try {
        const centroid = turf.centroid(geom);
        return {
          type: "Feature",
          geometry: centroid.geometry,
          properties: {
            title: r.vehicle?.area_name || "Area",
            reg_number: r.vehicle?.reg_number
          }
        };
      } catch {
        return null;
      }
    }).filter(Boolean)
  };

  // Build Area Boundaries GeoJSON
  const areaFeatures = areaBoundaries
    .map(ab => {
      const geom = extractGeometry(ab.geojson);
      if (!geom) return null;
      const v = ab.vehicle || {};
      const color = getVehicleColor(v.vehicle_type);
      return {
        type: "Feature",
        geometry: geom,
        properties: {
          vehicle_id: ab.vehicle_id,
          reg_number: v.reg_number,
          color,
          is_selected: ab.vehicle_id === selectedVehicleId,
        },
      };
    })
    .filter(Boolean);

  const areaBoundariesGeoJSON = {
    type: "FeatureCollection",
    features: areaFeatures,
  };

  const gtsGeoJSON = {
    type: "FeatureCollection",
    features: gts.filter(g => g.latitude && g.longitude).map(g => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [g.longitude, g.latitude] },
      properties: { 
        id: g.id,
        title: g.reg_number, 
        location: g.location_name || "Compactor Station",
        driver: g.driver_name || "N/A",
        phone: g.driver_phone || "N/A",
        capacity: g.capacity_cum || 0,
        served_ucs: g.served_ucs?.join(", ") || "N/A",
        type: "gts"
      },
    })),
  };

  const binsGeoJSON = {
    type: "FeatureCollection",
    features: bins.filter(b => b.latitude && b.longitude).map(b => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [b.longitude, b.latitude] },
      properties: { title: "Bin", subtitle: b.bin_type || "Waste Bin", type: "bin" },
    })),
  };

  const handleMapClick = useCallback((e: any) => {
    const features = e.features;
    if (!features?.length) return;
    const f       = features[0];
    const layerId = f.layer?.id;

    if (layerId === "boundary-fill") {
      const ucNumber = f.properties?.uc_number;
      if (!ucNumber) return;
      if (ucNumber !== currentUc) {
        router.push(`/dashboard?uc=${ucNumber}`);
      } else {
        setDetailPanel((prev: any) => prev ? null : uc);
      }
      return;
    }

    // Specialized GTS Popup
    if (f.properties?.type === "gts") {
      setPopup({
        longitude: e.lngLat.lng,
        latitude:  e.lngLat.lat,
        title:     f.properties.title,
        subtitle:  f.properties.location,
        details:   f.properties // Pass all properties for rich UI
      } as any);
      return;
    }

    // Route / bin popup
    if (f.properties?.vehicle_id) {
      setFocusedVehicleId(f.properties.vehicle_id);
      // You can also trigger the detail panel here if you have a vehicle detail component
    }

    setPopup({
      longitude: e.lngLat.lng,
      latitude:  e.lngLat.lat,
      title:     f.properties?.title    || "Feature",
      subtitle:  f.properties?.subtitle,
    });
  }, [currentUc, uc, router]);

  const handleVehicleClick = (vehicleId: string) => {
    setFocusedVehicleId(prev => prev === vehicleId ? null : vehicleId);
  };

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 67.1855, latitude: 24.8918, zoom: 13 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={[
          "boundary-fill",
          "gts-points",
          "bin-points",
          "selected-route",
          "unselected-route",
        ]}
        onClick={handleMapClick}
      >
        <NavigationControl position="bottom-right" />

        {/* Boundaries colored by status */}
        {boundary && layers.boundary && (
          <Source id="boundary" type="geojson" data={boundary as any}>
            <Layer
              id="boundary-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "match", ["get", "status"],
                  "complete",    "#10B981",
                  "in_progress", "#F59E0B",
                  "#64748b"
                ],
                "fill-opacity": [
                  "match", ["get", "status"],
                  "complete",    0.07,
                  "in_progress", 0.07,
                  0.02
                ],
              }}
            />
            <Layer
              id="boundary-line"
              type="line"
              paint={{
                "line-color": [
                  "match", ["get", "status"],
                  "complete",    "#10B981",
                  "in_progress", "#F59E0B",
                  "#64748b"
                ],
                "line-opacity": [
                  "match", ["get", "status"],
                  "complete",    1,
                  "in_progress", 1,
                  0.15
                ],
                "line-width": ["case", ["get", "is_active"], 4, 1.5], // Thicker active UC boundary
                "line-dasharray": [4, 2],
              }}
            />
          </Source>
        )}

        {/* ── AREA BOUNDARIES (Polygons) ── */}
        {areaBoundariesGeoJSON.features.length > 0 && (
          <Source id="area-boundaries" type="geojson" data={areaBoundariesGeoJSON as any}>
            <Layer
              id="area-fill"
              type="fill"
              paint={{
                "fill-color": ["get", "color"],
                "fill-opacity": [
                  "case",
                  ["boolean", ["get", "is_selected"], false],
                  0.3,
                  0.05
                ],
              }}
            />
            <Layer
              id="area-outline"
              type="line"
              paint={{
                "line-color": ["get", "color"],
                "line-width": [
                  "case",
                  ["boolean", ["get", "is_selected"], false],
                  4, // Much thicker area outline
                  2
                ],
                "line-dasharray": [
                  "case",
                  ["boolean", ["get", "is_selected"], false],
                  ["literal", [1, 0]],
                  ["literal", [2, 2]]
                ],
              }}
            />
          </Source>
        )}

        {/* Unselected routes — color per vehicle type, dimmed when one selected or focused */}
        {layers.routes && (
          <Source id="unselected-routes" type="geojson" data={unselectedRoutes as any}>
            <Layer
              id="unselected-route"
              type="line"
              paint={{
                "line-color":   ["get", "color"],
                "line-width":   2,
                "line-opacity": [
                  "case",
                  // If this is the focused vehicle, show it bright (though it's in the other layer too)
                  ["==", ["get", "vehicle_id"], focusedVehicleId || ""], 0,
                  // If this is the selected vehicle from sidebar, keep it hidden per user request
                  ["==", ["get", "vehicle_id"], selectedVehicleId || ""], 0,
                  // All other routes are invisible
                  0
                ],
              }}
            />
          </Source>
        )}

        {/* Selected/Focused route — bright + thick */}
        {layers.routes && (
          <Source id="selected-routes" type="geojson" data={selectedRoutes as any}>
            <Layer
              id="selected-route"
              type="line"
              paint={{
                "line-color":   ["get", "color"],
                "line-width":   5,
                "line-opacity": 1,
              }}
            />
          </Source>
        )}

        {/* Area Labels */}
        {layers.routes && (
          <Source id="area-labels" type="geojson" data={areaLabelsGeoJSON as any}>
            <Layer
              id="area-label-layer"
              type="symbol"
              layout={{
                "text-field": ["get", "title"],
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "text-size": 10,
                "text-transform": "uppercase",
                "text-letter-spacing": 0.05,
                "text-max-width": 8,
              }}
              paint={{
                "text-color": theme === "dark" ? "#cbd5e1" : "#475569",
                "text-halo-color": theme === "dark" ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.8)",
                "text-halo-width": 2,
              }}
            />
          </Source>
        )}

        {/* GTS */}
        {layers.gts && (
          <Source id="gts" type="geojson" data={gtsGeoJSON as any}>
            <Layer
              id="gts-points"
              type="circle"
              paint={{
                "circle-radius":       10,
                "circle-color":        "#F97316",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#FED7AA",
                "circle-opacity":      0.9,
              }}
            />
          </Source>
        )}

        {/* Bins */}
        {layers.bins && (
          <Source id="bins" type="geojson" data={binsGeoJSON as any}>
            <Layer
              id="bin-points"
              type="circle"
              paint={{
                "circle-radius":       6,
                "circle-color":        "#10B981",
                "circle-stroke-width": 1,
                "circle-stroke-color": "#A7F3D0",
                "circle-opacity":      0.9,
              }}
            />
          </Source>
        )}

        {/* Popup */}
        <AnimatePresence>
          {popup && (
            <Popup
              longitude={popup.longitude}
              latitude={popup.latitude}
              onClose={() => setPopup(null)}
              closeButton={false}
              anchor="bottom"
              offset={16}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-3 min-w-[200px] bg-card/95 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-foreground">{popup.title}</div>
                  <button
                    onClick={() => setPopup(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {(popup as any).details?.type === 'gts' ? (
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-amber-500 uppercase tracking-wider">
                      {(popup as any).details.location}
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-border/50">
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase">Capacity</div>
                        <div className="text-xs font-semibold">{(popup as any).details.capacity} CUM</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase">Serves UCs</div>
                        <div className="text-xs font-semibold text-blue-500">{(popup as any).details.served_ucs}</div>
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className="text-[9px] text-muted-foreground uppercase">Driver Info</div>
                      <div className="text-xs">{(popup as any).details.driver}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{(popup as any).details.phone}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-0.5">{popup.subtitle}</div>
                )}
              </motion.div>
            </Popup>
          )}
        </AnimatePresence>
      </Map>

      {/* Floating overlays */}
      {uc && (
        <MapStats
          ucName={`UC-${uc.uc_number} — ${uc.name}`}
          vehicleCount={vehicles.length}
          compactorCount={gts.length}
          zone={uc.zone}
          status={uc.status}
        />
      )}
      <LayerControls 
        layers={layers} 
        onToggle={toggle} 
        mapType={mapType}
        onMapTypeChange={setMapType}
      />

      {/* Floating Print Report button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openPrintPanel}
        className="absolute bottom-6 right-16 z-10 bg-card/90 backdrop-blur-md border border-border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2 hover:bg-accent transition-colors"
      >
        <Printer className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Print Report</span>
      </motion.button>

      <PrintPanel
        uc={uc}
        vehicles={vehicles}
        gts={gts}
        bins={bins}
        mapSnapshot={mapSnapshot}
        open={printOpen}
        onClose={() => setPrintOpen(false)}
      />

      {/* UC Detail Panel — slides in from right */}
      <AnimatePresence>
        {detailPanel && (
          <>
            {/* Invisible backdrop — click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailPanel(null)}
              className="absolute inset-0 z-20"
            />

            <motion.div
              initial={{ opacity: 0, x: 340 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 340 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 z-30 w-76 bg-card/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col"
              style={{ width: 300 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
                <div>
                  <div className="font-bold text-base">UC-{detailPanel.uc_number}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{detailPanel.name}</div>
                  <Badge
                    variant="outline"
                    className={`mt-1.5 text-[10px] ${statusBadgeStyle[detailPanel.status] || statusBadgeStyle.pending}`}
                  >
                    {detailPanel.status?.replace("_", " ")}
                  </Badge>
                </div>
                <button
                  onClick={() => setDetailPanel(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">

                {/* Info */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Zone</span>
                    <span className="font-medium text-xs">{detailPanel.zone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Supervisor</span>
                    <span className="font-medium text-xs">{detailPanel.supervisor_name || "Not set"}</span>
                  </div>
                  {detailPanel.supervisor_phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Phone</span>
                      <span className="font-mono text-xs">{detailPanel.supervisor_phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Vehicles", value: vehicles.length, icon: Truck,     color: "text-blue-400"    },
                    { label: "Compactors", value: gts.length,      icon: Building2, color: "text-amber-400"   },
                    { label: "Bins",     value: bins.length,      icon: MapPin,    color: "text-emerald-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-accent/40 rounded-xl p-2.5 text-center">
                      <s.icon className={`w-3.5 h-3.5 ${s.color} mx-auto mb-1`} />
                      <div className="font-bold text-base leading-none">{s.value}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Vehicle list — click to highlight route */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Vehicles — click to highlight route
                    </span>
                    {focusedVehicleId && (
                      <button
                        onClick={() => setFocusedVehicleId(null)}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        Clear Route <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {vehicles.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No vehicles assigned</div>
                    ) : vehicles.map(v => {
                      const color     = getVehicleColor(v.vehicle_type);
                      const isSelected = focusedVehicleId === v.id;
                      const hasRoute   = routes.some(r => r.vehicle_id === v.id);
                      return (
                        <motion.button
                          key={v.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => hasRoute && handleVehicleClick(v.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-blue-500/50 bg-blue-500/20 shadow-sm"
                              : hasRoute
                                ? "border-border/50 hover:border-border hover:bg-accent/30 cursor-pointer"
                                : "border-border/30 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          {/* Color dot matching route color */}
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-bold text-xs">{v.reg_number}</div>
                            {v.driver_name && (
                              <div className="text-[10px] text-muted-foreground truncate">{v.driver_name}</div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] text-muted-foreground capitalize">
                              {v.vehicle_type?.replace("_", " ")}
                            </span>
                            {hasRoute ? (
                              <Route className="w-2.5 h-2.5 text-muted-foreground/50" />
                            ) : (
                              <span className="text-[9px] text-muted-foreground/40">no route</span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* GTS section */}
                {gts.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Compactors
                    </div>
                    <div className="space-y-1.5">
                      {gts.map(g => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-accent/30 border border-border/50"
                        >
                          <span className="font-mono font-bold text-xs">{g.reg_number}</span>
                          <span className="text-xs text-amber-500">{g.capacity_cum} CUM</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border shrink-0">
                <button
                  onClick={() => {
                    setDetailPanel(null);
                    openPrintPanel();
                  }}
                  className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print UC Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}