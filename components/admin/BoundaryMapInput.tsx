"use client";
import { useCallback, useRef, useState, useEffect } from "react";
import Map, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import DrawControl from "./DrawControl";
import { useTheme } from "next-themes";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface BoundaryMapInputProps {
  initialGeoJSON?: any;
  onChange: (geojson: any) => void;
}

export default function BoundaryMapInput({ initialGeoJSON, onChange }: BoundaryMapInputProps) {
  const { theme } = useTheme();
  const drawRef = useRef<MapboxDraw | null>(null);

  const mapStyle = theme === "dark" 
    ? "mapbox://styles/mapbox/dark-v11" 
    : "mapbox://styles/mapbox/light-v11";

  const onUpdate = useCallback(() => {
    if (drawRef.current) {
      const data = drawRef.current.getAll();
      onChange(data);
    }
  }, [onChange]);

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

  // Calculate center of initialGeoJSON if provided
  let initialLng = 67.1855; // Korangi default
  let initialLat = 24.8918;

  if (initialGeoJSON) {
    try {
      // Very basic centroid approximation to center map on existing boundary
      let coords = [];
      if (initialGeoJSON.type === "FeatureCollection" && initialGeoJSON.features.length > 0) {
        coords = initialGeoJSON.features[0].geometry.coordinates[0];
      } else if (initialGeoJSON.type === "Feature") {
        coords = initialGeoJSON.geometry.coordinates[0];
      } else if (initialGeoJSON.coordinates) {
        coords = initialGeoJSON.coordinates[0];
      }

      if (coords && coords.length > 0) {
        initialLng = coords[0][0];
        initialLat = coords[0][1];
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-border relative">
      <Map
        initialViewState={{
          longitude: initialLng,
          latitude: initialLat,
          zoom: initialGeoJSON ? 13 : 11
        }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />
        
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
        />
      </Map>
    </div>
  );
}
