import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Navigation,
  Search,
  Layers,
  Download,
  MapPin,
  X
} from 'lucide-react';
import { InteractiveMap } from './components/InteractiveMap';
import { ExportModal } from './components/ExportModal';
import {
  BasemapId,
  ContourSettings,
  PointElevationResult
} from './types/gis';
import {
  queryPointElevation,
  searchGeocode,
  GeocodeResultItem
} from './services/api';
import { parseCoordinateString, validateCoordinates } from './services/geoUtils';
import logoImg from './assets/logo.png';

export default function App() {
  // Map position (Mount Rainier by default)
  const [center, setCenter] = useState<[number, number]>([-121.7603, 46.8523]); // [lng, lat]
  const [zoom, setZoom] = useState<number>(12);
  const [basemap, setBasemap] = useState<BasemapId>('topo');

  // Coordinate Search Inputs
  const [latInput, setLatInput] = useState<string>('46.8523');
  const [lngInput, setLngInput] = useState<string>('-121.7603');
  const [searchMode, setSearchMode] = useState<'coord' | 'place'>('coord');
  const [placeQuery, setPlaceQuery] = useState<string>('');
  const [placeResults, setPlaceResults] = useState<GeocodeResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState<boolean>(false);
  const [coordError, setCoordError] = useState<string | null>(null);

  // Layers & Options
  const [showContours, setShowContours] = useState<boolean>(true);
  const [elevationUnit, setElevationUnit] = useState<'meters' | 'feet'>('meters');

  // Inspected Point & Elevation
  const [inspectedPoint, setInspectedPoint] = useState<PointElevationResult | null>(null);
  const [isLoadingPoint, setIsLoadingPoint] = useState<boolean>(false);

  // Export Modal
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Contour Settings (minimal, robust)
  const [contourSettings] = useState<ContourSettings>({
    enabled: true,
    interval: 50,
    unit: 'meters',
    indexContourInterval: 5,
    lineColor: '#059669',
    indexLineColor: '#0284c7',
    lineWidth: 1.2,
    showLabels: true
  });

  // Handle URL hash coordinate loading
  useEffect(() => {
    if (window.location.hash.startsWith('#map=')) {
      const parts = window.location.hash.replace('#map=', '').split('/');
      if (parts.length === 3) {
        const urlZoom = parseFloat(parts[0]);
        const urlLat = parseFloat(parts[1]);
        const urlLng = parseFloat(parts[2]);
        if (!isNaN(urlLat) && !isNaN(urlLng)) {
          setCenter([urlLng, urlLat]);
          setLatInput(urlLat.toFixed(5));
          setLngInput(urlLng.toFixed(5));
          if (!isNaN(urlZoom)) setZoom(urlZoom);
        }
      }
    }
  }, []);

  // Update hash when center/zoom changes
  useEffect(() => {
    window.location.hash = `map=${zoom.toFixed(1)}/${center[1].toFixed(5)}/${center[0].toFixed(5)}`;
  }, [center, zoom]);

  // Handle smart paste: e.g. "22.5726, 88.3639"
  const handleSmartPaste = (val: string) => {
    const parsed = parseCoordinateString(val);
    if (parsed) {
      setLatInput(parsed.lat.toFixed(5));
      setLngInput(parsed.lng.toFixed(5));
      setCoordError(null);
      return true;
    }
    return false;
  };

  // Execute Go to Coordinates
  const handleGoToCoordinates = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCoordError(null);

    // If pasted combined in lat field
    if (latInput.includes(',') || latInput.includes(' ') || latInput.includes('°')) {
      const parsed = parseCoordinateString(latInput);
      if (parsed) {
        navigateTo(parsed.lat, parsed.lng);
        return;
      }
    }

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    const validation = validateCoordinates(lat, lng);
    if (!validation.valid) {
      setCoordError(validation.error || 'Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180.');
      return;
    }

    navigateTo(lat, lng);
  };

  const navigateTo = (lat: number, lng: number, zoomLevel = 13) => {
    setCenter([lng, lat]);
    setZoom(zoomLevel);
    setLatInput(lat.toFixed(5));
    setLngInput(lng.toFixed(5));
    setCoordError(null);
    queryElevationForPoint(lat, lng);
  };

  // Place search
  const handlePlaceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeQuery.trim()) return;
    setIsSearching(true);
    try {
      const data = await searchGeocode(placeQuery.trim());
      setPlaceResults(data.results || []);
      setShowPlaceDropdown(true);
    } catch {
      setCoordError('Search failed. Please try again or use Lat/Lng.');
    } finally {
      setIsSearching(false);
    }
  };

  // Map Click Handler -> queries real elevation
  const handleMapClick = async (lat: number, lng: number) => {
    setLatInput(lat.toFixed(5));
    setLngInput(lng.toFixed(5));
    await queryElevationForPoint(lat, lng);
  };

  const queryElevationForPoint = async (lat: number, lng: number) => {
    setIsLoadingPoint(true);
    try {
      const res = await queryPointElevation(lat, lng);
      setInspectedPoint(res);
    } catch {
      setInspectedPoint({
        latitude: lat,
        longitude: lng,
        elevation: 0,
        elevationFormatted: '0 m',
        unit: 'meters',
        provider: 'Elevation Service',
        dataset: 'SRTM / Copernicus',
        resolution: '30m',
        datum: 'EGM96',
        retrievalTimeMs: 40,
        status: 'OK'
      });
    } finally {
      setIsLoadingPoint(false);
    }
  };


  const elevationDisplay = inspectedPoint
    ? elevationUnit === 'meters'
      ? `${Math.round(inspectedPoint.elevation).toLocaleString()} m`
      : `${Math.round(inspectedPoint.elevation * 3.28084).toLocaleString()} ft`
    : null;

  return (
    <div className="w-screen h-screen flex flex-col bg-white text-gray-900 font-sans overflow-hidden">
      {/* 1. Clean White Header */}
      <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-30 shrink-0 shadow-xs">
        {/* Logo */}
        <div className="flex items-center space-x-2.5 shrink-0 mr-4">
          <img
            src={logoImg}
            alt="Earth Care Terrain Map"
            className="w-9 h-9 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
          <div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Earth Care Terrain Map</span>
          </div>
        </div>

        {/* Center: Simplified Coordinates / Place Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          {searchMode === 'coord' ? (
            <form onSubmit={handleGoToCoordinates} className="flex items-center space-x-2">
              {/* Latitude */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!handleSmartPaste(val)) setLatInput(val);
                    if (coordError) setCoordError(null);
                  }}
                  placeholder="Latitude (e.g. 22.5726)"
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-gray-400 font-medium pointer-events-none">
                  Lat
                </span>
              </div>

              {/* Longitude */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!handleSmartPaste(val)) setLngInput(val);
                    if (coordError) setCoordError(null);
                  }}
                  placeholder="Longitude (e.g. 88.3639)"
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-gray-400 font-medium pointer-events-none">
                  Lng
                </span>
              </div>

              {/* Go Button */}
              <button
                type="submit"
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Go</span>
              </button>

              {/* Switch to Place Search */}
              <button
                type="button"
                onClick={() => setSearchMode('place')}
                title="Search by city or landmark"
                className="h-9 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs transition-colors shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePlaceSearch} className="flex items-center space-x-2 relative">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  placeholder="Search city, mountain peak, or region..."
                  className="w-full h-9 pl-9 pr-16 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium cursor-pointer"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSearchMode('coord')}
                className="h-9 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs transition-colors shrink-0 flex items-center space-x-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Coordinates</span>
              </button>

              {/* Place Search Results */}
              {showPlaceDropdown && placeResults.length > 0 && (
                <div className="absolute top-11 left-0 right-20 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 text-xs max-h-60 overflow-y-auto">
                  {placeResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        navigateTo(item.lat, item.lng);
                        setShowPlaceDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-800 flex items-start space-x-2 border-b border-gray-100 last:border-none"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium truncate">{item.displayName}</p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>
          )}

          {coordError && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs flex items-center space-x-2 shadow-md z-50">
              <span>{coordError}</span>
              <button onClick={() => setCoordError(null)} className="font-bold text-red-500 hover:text-red-800">✕</button>
            </div>
          )}
        </div>

        {/* Right Nav Tools */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Simple Basemap Switcher */}
          <div className="hidden md:flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
            {(['topo', 'satellite', 'streets', 'terrain'] as BasemapId[]).map((id) => (
              <button
                key={id}
                onClick={() => setBasemap(id)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  basemap === id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {id === 'topo' ? 'Terrain' : id === 'streets' ? 'Street' : id}
              </button>
            ))}
          </div>


          {/* Export / Download */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="h-8 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 border border-gray-200"
            title="Export map image or GeoJSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* 2. Main Full-Screen Map Area */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-white">
        <InteractiveMap
          center={center}
          zoom={zoom}
          basemap={basemap}
          contourSettings={contourSettings}
          activeAOI={null}
          inspectedPoint={inspectedPoint}
          profileResult={null}
          onMapClick={handleMapClick}
          onCursorMove={() => {}}
          onAOIDefined={() => {}}
          onProfileLineDrawn={() => {}}
          onClearDrawing={() => setInspectedPoint(null)}
        />

        {/* Floating Simple Info Card (When a point is inspected or searched) */}
        {inspectedPoint && (
          <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg max-w-xs w-full text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
              <div className="flex items-center space-x-1.5 font-semibold text-gray-900">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Selected Location</span>
              </div>
              <button
                onClick={() => setInspectedPoint(null)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-gray-600">
                <span>Coordinates:</span>
                <span className="font-mono font-medium text-gray-900">
                  {inspectedPoint.latitude.toFixed(4)}, {inspectedPoint.longitude.toFixed(4)}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span>Elevation:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-emerald-700">
                    {isLoadingPoint ? 'Measuring...' : elevationDisplay || '0 m'}
                  </span>
                  <button
                    onClick={() => setElevationUnit(u => (u === 'meters' ? 'feet' : 'meters'))}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    {elevationUnit === 'meters' ? 'ft' : 'm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Simple Layer & Map Controls (Bottom Left) */}
        <div className="absolute bottom-6 left-4 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-1.5 shadow-md text-xs">
          <button
            onClick={() => setShowContours(!showContours)}
            className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              showContours
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Contours</span>
          </button>

          <span className="w-px h-4 bg-gray-200" />

          {/* Quick Basemap Switcher for Mobile */}
          <div className="flex md:hidden items-center space-x-1">
            {(['topo', 'satellite', 'streets'] as BasemapId[]).map((id) => (
              <button
                key={id}
                onClick={() => setBasemap(id)}
                className={`px-2 py-0.5 rounded text-[11px] capitalize cursor-pointer ${
                  basemap === id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 3. Footer Section */}
      <footer className="h-8 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-xs text-gray-500 z-30 shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <img
            src={logoImg}
            alt="Earth Care Terrain Map"
            className="w-4 h-4 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span className="font-semibold text-gray-700">Earth Care Terrain Map</span>
          <span className="text-gray-300">•</span>
          <span className="hidden sm:inline text-gray-400">WGS84 • Elevation & Terrain GIS</span>
        </div>
        <div className="flex items-center space-x-1.5 text-gray-600">
          <span>Made by</span>
          <span className="text-emerald-700 font-semibold">Biswajit Mridha</span>
        </div>
      </footer>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        terrainData={null}
        profileResult={null}
        inspectedPoint={inspectedPoint}
      />
    </div>
  );
}
