/**
 * Custom styles for Mapbox Draw to fix validation errors with line-dasharray
 * and Mapbox GL JS 2.x/3.x expressions.
 */
export const drawStyles = [
  // ACTIVE (HOT)
  // line stroke
  {
    "id": "gl-draw-line-hot",
    "type": "line",
    "filter": ["all", ["==", "$type", "LineString"], ["==", "active", "true"]],
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#fbb03b",
      "line-dasharray": ["literal", [0.2, 2]],
      "line-width": 2
    }
  },
  // polygon fill
  {
    "id": "gl-draw-polygon-fill-hot",
    "type": "fill",
    "filter": ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
    "paint": {
      "fill-color": "#fbb03b",
      "fill-outline-color": "#fbb03b",
      "fill-opacity": 0.1
    }
  },
  // polygon outline
  {
    "id": "gl-draw-polygon-stroke-hot",
    "type": "line",
    "filter": ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#fbb03b",
      "line-dasharray": ["literal", [0.2, 2]],
      "line-width": 2
    }
  },
  // INACTIVE (COLD)
  // line stroke
  {
    "id": "gl-draw-line-cold",
    "type": "line",
    "filter": ["all", ["==", "$type", "LineString"], ["==", "active", "false"]],
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#3bb2d0",
      "line-width": 2
    }
  },
  // polygon fill
  {
    "id": "gl-draw-polygon-fill-cold",
    "type": "fill",
    "filter": ["all", ["==", "$type", "Polygon"], ["==", "active", "false"]],
    "paint": {
      "fill-color": "#3bb2d0",
      "fill-outline-color": "#3bb2d0",
      "fill-opacity": 0.1
    }
  },
  // polygon outline
  {
    "id": "gl-draw-polygon-stroke-cold",
    "type": "line",
    "filter": ["all", ["==", "$type", "Polygon"], ["==", "active", "false"]],
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#3bb2d0",
      "line-width": 2
    }
  },
  // vertex point halos
  {
    "id": "gl-draw-polygon-and-line-vertex-halo-active",
    "type": "circle",
    "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
    "paint": {
      "circle-radius": 5,
      "circle-color": "#FFF"
    }
  },
  // vertex points
  {
    "id": "gl-draw-polygon-and-line-vertex-active",
    "type": "circle",
    "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
    "paint": {
      "circle-radius": 3,
      "circle-color": "#fbb03b"
    }
  },
  // midpoints
  {
    "id": "gl-draw-polygon-and-line-midpoint",
    "type": "circle",
    "filter": ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"]],
    "paint": {
      "circle-radius": 3,
      "circle-color": "#fbb03b"
    }
  },
  // point
  {
    "id": "gl-draw-point-point-stroke-hot",
    "type": "circle",
    "filter": ["all", ["==", "active", "true"], ["==", "$type", "Point"], ["==", "meta", "feature"], ["!=", "mode", "static"]],
    "paint": {
      "circle-radius": 5,
      "circle-color": "#fff"
    }
  },
  {
    "id": "gl-draw-point-inactive",
    "type": "circle",
    "filter": ["all", ["==", "active", "false"], ["==", "$type", "Point"], ["==", "meta", "feature"], ["!=", "mode", "static"]],
    "paint": {
      "circle-radius": 3,
      "circle-color": "#3bb2d0"
    }
  },
  {
    "id": "gl-draw-point-stroke-active",
    "type": "circle",
    "filter": ["all", ["==", "active", "true"], ["==", "$type", "Point"], ["==", "meta", "feature"], ["!=", "mode", "static"]],
    "paint": {
      "circle-radius": 7,
      "circle-color": "#fbb03b"
    }
  },
  {
    "id": "gl-draw-point-active",
    "type": "circle",
    "filter": ["all", ["==", "active", "true"], ["==", "$type", "Point"], ["==", "meta", "feature"], ["!=", "mode", "static"]],
    "paint": {
      "circle-radius": 3,
      "circle-color": "#fbb03b"
    }
  },
  // static
  {
    "id": "gl-draw-polygon-fill-static",
    "type": "fill",
    "filter": ["all", ["==", "mode", "static"], ["==", "$type", "Polygon"]],
    "paint": {
      "fill-color": "#404040",
      "fill-outline-color": "#404040",
      "fill-opacity": 0.1
    }
  },
  {
    "id": "gl-draw-polygon-stroke-static",
    "type": "line",
    "filter": ["all", ["==", "mode", "static"], ["==", "$type", "Polygon"]],
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#404040",
      "line-width": 2
    }
  },
  {
    "id": "gl-draw-line-static",
    "type": "line",
    "filter": ["all", ["==", "mode", "static"], ["==", "$type", "LineString"]],
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#404040",
      "line-width": 2
    }
  },
  {
    "id": "gl-draw-point-static",
    "type": "circle",
    "filter": ["all", ["==", "mode", "static"], ["==", "$type", "Point"]],
    "paint": {
      "circle-radius": 5,
      "circle-color": "#404040"
    }
  }
];
