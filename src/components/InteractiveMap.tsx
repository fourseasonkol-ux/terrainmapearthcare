import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';

type MapLibreMap = maplibregl.Map;
type LngLatLike = maplibregl.LngLatLike;
type Marker = maplibregl.Marker;

// Configure MapLibre Web Worker explicitly to avoid Vite cross-origin iframe blob worker failures
if (typeof window !== 'undefined') {
  try {
    maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
  } catch (err) {
    console.warn('MapLibre worker setup:', err);
  }
}

import {
  Layers,
  Maximize2,
  Minimize2,
  MousePointer,
  Square,
  Activity,
  Trash2,
  Compass,
  AlertCircle,
  Navigation,
  MapPin
} from 'lucide-react';
import {
  BasemapId,
  ContourSettings,
  AreaOfInterest,
  PointElevationResult,
  ProfileAnalysisResult
} from '../types/gis';
import { formatDMS } from '../services/geoUtils';

interface InteractiveMapProps {
  center: [number, number]; // [lng, lat]
  zoom: number;
  basemap: BasemapId;
  contoursGeoJson?: GeoJSON.FeatureCollection | null;
  contourSettings: ContourSettings;
  activeAOI: AreaOfInterest | null;
  inspectedPoint: PointElevationResult | null;
  profileResult: ProfileAnalysisResult | null;
  lulcEnabled?: boolean;
  lulcOpacity?: number;
  onMapClick: (lat: number, lng: number) => void;
  onCursorMove: (lat: number, lng: number) => void;
  onAOIDefined: (bbox: [number, number, number, number]) => void;
  onProfileLineDrawn: (coordinates: [number, number][]) => void;
  onClearDrawing: () => void;
  onOpenCoordModal?: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  zoom,
  basemap,
  contoursGeoJson,
  contourSettings,
  activeAOI,
  inspectedPoint,
  profileResult,
  lulcEnabled = false,
  lulcOpacity = 0.7,
  onMapClick,
  onCursorMove,
  onAOIDefined,
  onProfileLineDrawn,
  onClearDrawing,
  onOpenCoordModal
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const locationMarkerRef = useRef<Marker | null>(null);

  const [activeDrawMode, setActiveDrawMode] = useState<'point' | 'bbox' | 'line'>('point');
  const [bboxStartPoint, setBboxStartPoint] = useState<[number, number] | null>(null);
  const [linePoints, setLinePoints] = useState<[number, number][]>([]);
  const [hoveredContourElevation, setHoveredContourElevation] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Complete definition of all 8 required Basemaps with real, authoritative tile sources
  const getBasemapStyle = (base: BasemapId): maplibregl.StyleSpecification => {
    let tileUrl = 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';
    let attribution = '© OpenTopoMap contributors, SRTM';
    let maxzoom = 17;
    let overlayTileUrl: string | null = null;

    switch (base) {
      case 'streets':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
        attribution = '© Esri, DeLorme, NAVTEQ, TomTom, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community';
        maxzoom = 19;
        break;
      case 'satellite':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attribution = 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
        maxzoom = 18;
        break;
      case 'terrain':
        tileUrl = 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';
        attribution = '© OpenTopoMap contributors, SRTM';
        maxzoom = 17;
        break;
      case 'hybrid':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        overlayTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
        attribution = 'Tiles © Esri & Imagery contributors';
        maxzoom = 18;
        break;
      case 'topo':
        tileUrl = 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';
        attribution = '© OpenTopoMap contributors, SRTM';
        maxzoom = 17;
        break;
      case 'light':
        tileUrl = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
        attribution = '© OpenStreetMap contributors, © CARTO';
        maxzoom = 19;
        break;
      case 'dark':
        tileUrl = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
        attribution = '© OpenStreetMap contributors, © CARTO';
        maxzoom = 19;
        break;
      case 'osm':
      default:
        tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        attribution = '© OpenStreetMap contributors';
        maxzoom = 19;
        break;
    }

    const sources: Record<string, any> = {
      'raster-basemap': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution,
        maxzoom
      }
    };

    const layers: any[] = [
      {
        id: 'raster-basemap-layer',
        type: 'raster',
        source: 'raster-basemap',
        minzoom: 0,
        maxzoom: 22
      }
    ];

    // Hybrid overlay for boundaries and place names
    if (overlayTileUrl) {
      sources['raster-hybrid-overlay'] = {
        type: 'raster',
        tiles: [overlayTileUrl],
        tileSize: 256,
        attribution: 'Esri Boundaries/Labels',
        maxzoom
      };
      layers.push({
        id: 'raster-hybrid-overlay-layer',
        type: 'raster',
        source: 'raster-hybrid-overlay',
        minzoom: 0,
        maxzoom: 22
      });
    }

    return {
      version: 8,
      sources,
      layers
    };
  };

  // Initialize MapLibre Engine
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getBasemapStyle(basemap),
        center: center as LngLatLike,
        zoom: zoom,
        attributionControl: false
      });

      // Navigation controls (zoom, compass, pitch)
      map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

      // Metric & Imperial Scale bar
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 140, unit: 'metric' }), 'bottom-left');

      map.on('mousemove', (e: maplibregl.MapMouseEvent) => {
        onCursorMove(e.lngLat.lat, e.lngLat.lng);
      });

      map.on('load', () => {
        addGeoJsonSources(map);
        updateLocationMarker(map, center[1], center[0]);
      });

      mapRef.current = map;

      return () => {
        if (locationMarkerRef.current) {
          locationMarkerRef.current.remove();
          locationMarkerRef.current = null;
        }
        map.remove();
        mapRef.current = null;
      };
    } catch (err: any) {
      console.error('Failed to initialize MapLibre:', err);
      setMapError('Failed to initialize WebGL map engine. Please ensure hardware acceleration is enabled.');
    }
  }, []);

  // Handle Basemap Switch while preserving active state, marker, and layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(getBasemapStyle(basemap));
    map.once('style.load', () => {
      addGeoJsonSources(map);
      updateContourLayer(map, contoursGeoJson);
      updateAOILayer(map, activeAOI);
      updateLineLayer(map, linePoints);
      updateLocationMarker(map, center[1], center[0]);
    });
  }, [basemap]);

  // Center / Zoom Navigation Update (Strictly using [longitude, latitude] for MapLibre)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentCenter = map.getCenter();
    const dLat = Math.abs(currentCenter.lat - center[1]);
    const dLng = Math.abs(currentCenter.lng - center[0]);
    const dZoom = Math.abs(map.getZoom() - zoom);

    if (dLat > 0.0001 || dLng > 0.0001 || dZoom > 0.4) {
      map.flyTo({
        center: [center[0], center[1]], // [longitude, latitude] strictly
        zoom: zoom,
        essential: true,
        duration: 1000
      });
    }

    // Always update location pin marker at new center
    updateLocationMarker(map, center[1], center[0]);
  }, [center, zoom]);

  // Helper: Create or update the visible Target Location Pin Marker
  const updateLocationMarker = (map: MapLibreMap, lat: number, lng: number) => {
    if (!map) return;

    if (!locationMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'group relative flex flex-col items-center cursor-pointer';
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white ring-4 ring-emerald-400/30 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div class="hidden group-hover:block absolute bottom-9 bg-white text-gray-800 text-[11px] font-mono px-2 py-1 rounded shadow-md border border-gray-200 whitespace-nowrap z-50">
          ${lat.toFixed(5)}°, ${lng.toFixed(5)}°
        </div>
      `;

      locationMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      locationMarkerRef.current.setLngLat([lng, lat]);
    }
  };

  // Helper: setup GeoJSON sources on map
  const addGeoJsonSources = (map: MapLibreMap) => {
    // 1. Contours Source & Layers
    if (!map.getSource('contours-source')) {
      map.addSource('contours-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Intermediate contours
      map.addLayer({
        id: 'contours-intermediate-layer',
        type: 'line',
        source: 'contours-source',
        filter: ['!=', ['get', 'isIndex'], true],
        paint: {
          'line-color': contourSettings.lineColor || '#56E6B2',
          'line-width': contourSettings.lineWidth || 1.0,
          'line-opacity': 0.85
        }
      });

      // Index contours (bold)
      map.addLayer({
        id: 'contours-index-layer',
        type: 'line',
        source: 'contours-source',
        filter: ['==', ['get', 'isIndex'], true],
        paint: {
          'line-color': contourSettings.indexLineColor || '#38BDF8',
          'line-width': (contourSettings.lineWidth || 1.0) * 2.2,
          'line-opacity': 0.95
        }
      });

      map.on('mousemove', 'contours-index-layer', (e) => {
        if (e.features && e.features.length > 0) {
          const elev = e.features[0].properties?.elevation;
          if (elev !== undefined) {
            setHoveredContourElevation(`Index Contour: ${Math.round(elev)} m (${Math.round(elev * 3.28084)} ft)`);
          }
        }
      });

      map.on('mouseleave', 'contours-index-layer', () => {
        setHoveredContourElevation(null);
      });
    }

    // 2. AOI BBox Source & Layer
    if (!map.getSource('aoi-source')) {
      map.addSource('aoi-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'aoi-fill-layer',
        type: 'fill',
        source: 'aoi-source',
        paint: {
          'fill-color': '#56E6B2',
          'fill-opacity': 0.12
        }
      });

      map.addLayer({
        id: 'aoi-outline-layer',
        type: 'line',
        source: 'aoi-source',
        paint: {
          'line-color': '#56E6B2',
          'line-width': 2,
          'line-dasharray': [4, 2]
        }
      });
    }

    // 3. Elevation Profile Line Source & Layer
    if (!map.getSource('profile-line-source')) {
      map.addSource('profile-line-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'profile-line-layer',
        type: 'line',
        source: 'profile-line-source',
        paint: {
          'line-color': '#F59E0B',
          'line-width': 3,
          'line-opacity': 0.9
        }
      });
    }
  };

  const updateContourLayer = (map: MapLibreMap, data?: GeoJSON.FeatureCollection | null) => {
    const source = map.getSource('contours-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(data || { type: 'FeatureCollection', features: [] });
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) {
      updateContourLayer(map, contoursGeoJson);
    }
  }, [contoursGeoJson]);

  const updateAOILayer = (map: MapLibreMap, aoi: AreaOfInterest | null) => {
    const source = map.getSource('aoi-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (!aoi) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const [west, south, east, north] = aoi.bbox;
    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [west, south],
                [east, south],
                [east, north],
                [west, north],
                [west, south]
              ]
            ]
          }
        }
      ]
    });
  };

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) {
      updateAOILayer(map, activeAOI);
    }
  }, [activeAOI]);

  const updateLineLayer = (map: MapLibreMap, points: [number, number][]) => {
    const source = map.getSource('profile-line-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (points.length < 2) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: points
          }
        }
      ]
    });
  };

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) {
      updateLineLayer(map, linePoints);
    }
  }, [linePoints]);

  // Handle Map Clicks
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const { lat, lng } = e.lngLat;

      if (activeDrawMode === 'point') {
        updateLocationMarker(map, lat, lng);
        onMapClick(lat, lng);
      } else if (activeDrawMode === 'bbox') {
        if (!bboxStartPoint) {
          setBboxStartPoint([lng, lat]);
        } else {
          const west = Math.min(bboxStartPoint[0], lng);
          const east = Math.max(bboxStartPoint[0], lng);
          const south = Math.min(bboxStartPoint[1], lat);
          const north = Math.max(bboxStartPoint[1], lat);

          setBboxStartPoint(null);
          onAOIDefined([west, south, east, north]);
          setActiveDrawMode('point');
        }
      } else if (activeDrawMode === 'line') {
        const nextPoints: [number, number][] = [...linePoints, [lng, lat]];
        setLinePoints(nextPoints);
        if (nextPoints.length >= 2) {
          onProfileLineDrawn(nextPoints);
        }
      }
    };

    const handleDblClick = (e: maplibregl.MapMouseEvent) => {
      if (activeDrawMode === 'line') {
        e.preventDefault();
        setActiveDrawMode('point');
      }
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDblClick);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDblClick);
    };
  }, [activeDrawMode, bboxStartPoint, linePoints]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleResetDrawings = () => {
    setBboxStartPoint(null);
    setLinePoints([]);
    setActiveDrawMode('point');
    onClearDrawing();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      {/* MapLibre WebGL canvas container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Error Notice */}
      {mapError && (
        <div className="absolute inset-0 bg-white/95 z-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-red-200 p-6 rounded-xl shadow-xl">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Engine Notice</h3>
            <p className="text-xs text-gray-600 mb-4">{mapError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white font-medium text-xs rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Reload Map
            </button>
          </div>
        </div>
      )}

      {/* Bottom Right Map Controls: Fullscreen */}
      <div className="absolute bottom-6 right-3 z-20 flex items-center space-x-2">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          className="p-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg shadow-sm transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Subtle North Arrow Badge */}
      <div className="absolute top-4 right-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm pointer-events-none text-emerald-600">
        <Compass className="w-4 h-4" />
      </div>
    </div>
  );
};

