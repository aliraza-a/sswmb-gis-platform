"use client";
import { useEffect, useState } from "react";
import Map, { Source, Layer, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/lib/supabase";
import LayerControls, { LayerState } from "./LayerControls";
import MapStats from "./MapStats";
import PrintPanel from "./PrintPanel";
import VehiclePanel from "./VehiclePanel";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface PopupInfo {
  longitude: number;
  latitude: number;
  title: string;
  subtitle?: string;
}

function extractGeometry(geojson: any) {
  if (!geojson) return null;
  if (geojson.type === "FeatureCollection" && geojson.features && geojson.features.length > 0) {
    return geojson.features[0].geometry;
  }
  if (geojson.type === "Feature") {
    return geojson.geometry;
  }
  if (geojson.coordinates) {
    return geojson;
  }
  return null;
}

export default function MapView() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const currentUc = parseInt(searchParams.get("uc") || "1", 10);
  const [uc, setUc] = useState<any>(null);
  const [boundary, setBoundary] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [gts, setGts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerState>({
    boundary: true,
    routes: true,
    gts: true,
    bins: true,
  });

  const mapStyle =
    theme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/light-v11";

  const toggle = (key: keyof LayerState) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    async function fetchAll() {
      // Fetch all boundaries
      const { data: allBoundariesData } = await supabase
        .from("uc_boundary")
        .select("uc_id, geojson, uc(uc_number)");
      
      const parsedBoundaries = {
        type: "FeatureCollection",
        features: (allBoundariesData || [])
          .map((b: any) => {
             const geom = extractGeometry(b.geojson);
             if (!geom) return null;
             const is_active = b.uc?.uc_number === currentUc;
             return {
               type: "Feature",
               geometry: geom,
               properties: {
                 uc_id: b.uc_id,
                 uc_number: b.uc?.uc_number,
                 is_active
               }
             };
          })
          .filter(Boolean)
      };
      setBoundary(parsedBoundaries);

      // Fetch active UC
      const { data: ucData } = await supabase
        .from("uc")
        .select("*")
        .eq("uc_number", currentUc)
        .single();
      
      if (!ucData) {
        setUc(null);
        setVehicles([]);
        setGts([]);
        setRoutes([]);
        setBins([]);
        return;
      }
      setUc(ucData);

      const { data: vehicleData } = await supabase
        .from("vehicle")
        .select("*")
        .eq("uc_id", ucData.id);
      setVehicles(vehicleData || []);

      const { data: gtsUcData } = await supabase
        .from("gts_uc")
        .select("gts_id")
        .eq("uc_id", ucData.id);

      if (gtsUcData && gtsUcData.length > 0) {
        const gtsIds = gtsUcData.map((g) => g.gts_id);
        const { data: gtsData } = await supabase
          .from("gts")
          .select("*")
          .in("id", gtsIds);
        setGts(gtsData || []);
      }

      const { data: routeData } = await supabase
        .from("route")
        .select("*, vehicle(reg_number, vehicle_type, driver_name, driver_phone, shift)")
        .eq("uc_id", ucData.id);
      setRoutes(routeData || []);

      const { data: binData } = await supabase
        .from("bin")
        .select("*")
        .eq("uc_id", ucData.id);
      setBins(binData || []);
    }
    fetchAll();
  }, [currentUc]);

  const gtsGeoJSON = {
    type: "FeatureCollection",
    features: gts
      .filter((g) => g.latitude && g.longitude)
      .map((g) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [g.longitude, g.latitude] },
        properties: { title: g.reg_number, subtitle: g.vehicle_type || "Compactor" },
      })),
  };

  const allRoutes = routes
    .filter((r) => r.geojson)
    .map((r) => {
      const geom = extractGeometry(r.geojson);
      if (!geom) return null;
      
      const v = r.vehicle || {};
      const subtitleParts = [];
      if (v.driver_name) subtitleParts.push(`Driver: ${v.driver_name}`);
      if (v.driver_phone) subtitleParts.push(v.driver_phone);
      if (v.vehicle_type) subtitleParts.push(v.vehicle_type.replace('_', ' '));

      return {
        type: "Feature",
        geometry: geom,
        properties: { 
          vehicle_id: r.vehicle_id,
          title: `${v.reg_number || 'Unknown Route'}`, 
          subtitle: subtitleParts.length > 0 ? subtitleParts.join(" • ") : "Route" 
        },
      };
    })
    .filter(Boolean);

  const activeRoutesGeoJSON = {
    type: "FeatureCollection",
    features: selectedVehicleId 
      ? allRoutes.filter((r: any) => r.properties.vehicle_id === selectedVehicleId)
      : [],
  };

  const inactiveRoutesGeoJSON = {
    type: "FeatureCollection",
    features: selectedVehicleId
      ? allRoutes.filter((r: any) => r.properties.vehicle_id !== selectedVehicleId)
      : allRoutes,
  };

  const binsGeoJSON = {
    type: "FeatureCollection",
    features: bins
      .filter((b) => b.latitude && b.longitude)
      .map((b) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [b.longitude, b.latitude] },
        properties: { title: "Bin", subtitle: b.bin_type ? `${b.capacity_ltr || ''}L - ${b.bin_type}` : "Waste Bin" },
      })),
  };

  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={{ longitude: 67.1855, latitude: 24.8918, zoom: 14 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={["gts-points", "bin-points", "active-routes-line", "inactive-routes-line"]}
        onClick={(e) => {
          const features = e.features;
          if (features && features.length > 0) {
            const props = features[0].properties;
            setPopup({
              longitude: e.lngLat.lng,
              latitude: e.lngLat.lat,
              title: props?.title || "GTS",
              subtitle: props?.subtitle,
            });
          }
        }}
      >
        <NavigationControl position="bottom-right" />

        {/* UC Boundary */}
        {boundary && layers.boundary && (
          <Source id="boundary" type="geojson" data={boundary as any}>
            <Layer
              id="boundary-fill"
              type="fill"
              paint={{
                "fill-color": ["case", ["==", ["get", "is_active"], true], "#3B82F6", "#64748b"],
                "fill-opacity": ["case", ["==", ["get", "is_active"], true], 0.08, 0.02]
              }}
            />
            <Layer
              id="boundary-line"
              type="line"
              paint={{
                "line-color": ["case", ["==", ["get", "is_active"], true], "#3B82F6", "#64748b"],
                "line-width": ["case", ["==", ["get", "is_active"], true], 2, 1],
                "line-dasharray": [4, 2],
              }}
            />
          </Source>
        )}

        {/* GTS Points */}
        {layers.gts && (
          <Source id="gts" type="geojson" data={gtsGeoJSON as any}>
            <Layer
              id="gts-points"
              type="circle"
              paint={{
                "circle-radius": 10,
                "circle-color": "#F97316",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#FED7AA",
                "circle-opacity": 0.9,
              }}
            />
          </Source>
        )}


        {/* Bin Points */}
        {layers.bins && (
          <Source id="bins" type="geojson" data={binsGeoJSON as any}>
            <Layer
              id="bin-points"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": "#10B981",
                "circle-stroke-width": 1,
                "circle-stroke-color": "#A7F3D0",
                "circle-opacity": 0.9,
              }}
            />
          </Source>
        )}

        {/* Routes */}
        {layers.routes && (
          <>
            <Source id="inactive-routes" type="geojson" data={inactiveRoutesGeoJSON as any}>
              <Layer
                id="inactive-routes-line"
                type="line"
                paint={{
                  "line-color": "#F59E0B",
                  "line-width": 2,
                  "line-opacity": selectedVehicleId ? 0.15 : 0.4,
                }}
              />
            </Source>
            <Source id="active-routes" type="geojson" data={activeRoutesGeoJSON as any}>
              <Layer
                id="active-routes-line"
                type="line"
                paint={{
                  "line-color": "#F59E0B",
                  "line-width": 5,
                  "line-opacity": 0.9,
                }}
              />
            </Source>
          </>
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
                className="p-2 min-w-32"
              >
                <div className="font-semibold text-sm text-foreground">
                  {popup.title}
                </div>
                {popup.subtitle && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {popup.subtitle}
                  </div>
                )}
                <button
                  onClick={() => setPopup(null)}
                  className="absolute top-1 right-1 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </motion.div>
            </Popup>
          )}
        </AnimatePresence>
      </Map>

      {/* Floating overlays */}
      <VehiclePanel 
        vehicles={vehicles} 
        selectedVehicleId={selectedVehicleId} 
        onSelectVehicle={setSelectedVehicleId} 
      />
      {uc && (
        <MapStats
          ucName={`UC-${uc.uc_number} — ${uc.name}`}
          vehicleCount={vehicles.length}
          gtsCount={gts.length}
          zone={uc.zone}
          status={uc.status}
        />
      )}

      <LayerControls layers={layers} onToggle={toggle} />
      <PrintPanel uc={uc} vehicles={vehicles} gts={gts} />
    </div>
  );
}
