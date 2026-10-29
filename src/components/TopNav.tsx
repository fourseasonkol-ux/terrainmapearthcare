import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Search,
  FolderOpen,
  Database,
  BookOpen,
  Download,
  Sparkles,
  RefreshCw,
  Compass,
  MapPin,
  HelpCircle,
  Navigation,
  Layers,
  Map as MapIcon
} from 'lucide-react';
import { formatDMS, parseCoordinateString, validateCoordinates } from '../services/geoUtils';
import { searchGeocode, GeocodeResultItem } from '../services/api';
import { CoordinateInputModal } from './CoordinateInputModal';

interface TopNavProps {
  currentCoordinates: { lat: number; lng: number } | null;
  cursorCoordinates: { lat: number; lng: number } | null;
  elevationUnit: 'meters' | 'feet';
  onLocationSelected: (result: GeocodeResultItem, zoomLevel?: number) => void;
  onNewMap: () => void;
  onOpenProjects: () => void;
  onOpenDataSources: () => void;
  onOpenDocs: () => void;
  onOpenExport: () => void;
  onOpenAIAssistant: () => void;
  onOpenThematicLULC: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentCoordinates,
  cursorCoordinates,
  elevationUnit,
  onLocationSelected,
  onNewMap,
  onOpenProjects,
  onOpenDataSources,
  onOpenDocs,
  onOpenExport,
  onOpenAIAssistant,
  onOpenThematicLULC
}) => {
  // Separate Dedicated Latitude and Longitude Fields
  const [latInput, setLatInput] = useState<string>('');
  const [lngInput, setLngInput] = useState<string>('');
  const [selectedZoom, setSelectedZoom] = useState<number>(13);
  const [coordError, setCoordError] = useState<string | null>(null);

  // Quick place search state
  const [placeQuery, setPlaceQuery] = useState('');
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [placeResults, setPlaceResults] = useState<GeocodeResultItem[]>([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState<'latlng' | 'place'>('latlng');
  const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);

  // When current coordinates change from map clicks, sync inputs
  useEffect(() => {
    if (currentCoordinates) {
      setLatInput(currentCoordinates.lat.toFixed(5));
      setLngInput(currentCoordinates.lng.toFixed(5));
    }
  }, [currentCoordinates]);

  // Handle smart paste: e.g. "22.5726, 88.3639" into either input
  const handleSmartPaste = (pastedText: string) => {
    const parsed = parseCoordinateString(pastedText);
    if (parsed) {
      setLatInput(parsed.lat.toFixed(5));
      setLngInput(parsed.lng.toFixed(5));
      setCoordError(null);
      return true;
    }
    return false;
  };

  // Submit Latitude & Longitude Search
  const handleGoToCoordinates = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCoordError(null);

    // 1. Check if user pasted a combined coordinate string into the latitude input
    if (latInput.includes(',') || latInput.includes(' ') || latInput.includes('°')) {
      const parsed = parseCoordinateString(latInput);
      if (parsed) {
        executeNavigation(parsed.lat, parsed.lng, selectedZoom);
        return;
      }
    }

    if (!latInput.trim() || !lngInput.trim()) {
      setCoordError('Please enter both Latitude and Longitude (e.g. 22.5726, 88.3639)');
      return;
    }

    const lat = parseFloat(latInput.trim());
    const lng = parseFloat(lngInput.trim());

    const validation = validateCoordinates(lat, lng);
    if (!validation.valid) {
      setCoordError(validation.error || 'Invalid coordinates: Latitude must be -90 to 90, Longitude -180 to 180.');
      return;
    }

    executeNavigation(lat, lng, selectedZoom);
  };

  const executeNavigation = (lat: number, lng: number, zoom: number) => {
    // Construct valid GeocodeResultItem
    const item: GeocodeResultItem = {
      displayName: `Target Location: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
      lat,
      lng,
      bbox: [lng - 0.05, lat - 0.05, lng + 0.05, lat + 0.05],
      type: 'coordinate_lookup'
    };

    setLatInput(lat.toFixed(5));
    setLngInput(lng.toFixed(5));
    setCoordError(null);

    // Update browser URL hash for bookmarking and state preservation
    try {
      window.location.hash = `map=${zoom}/${lat.toFixed(5)}/${lng.toFixed(5)}`;
    } catch (_) {}

    // Immediately trigger navigation without waiting for dropdown clicks
    onLocationSelected(item, zoom);
  };

  // Place name search
  const handlePlaceSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = placeQuery.trim();
    if (!query) return;

    // Check if coordinates entered into place search
    const parsedCoords = parseCoordinateString(query);
    if (parsedCoords) {
      executeNavigation(parsedCoords.lat, parsedCoords.lng, selectedZoom);
      setShowPlaceDropdown(false);
      return;
    }

    setIsSearchingPlace(true);
    try {
      const data = await searchGeocode(query);
      if (data.results && data.results.length > 0) {
        if (data.type === 'coordinates') {
          const first = data.results[0];
          executeNavigation(first.lat, first.lng, selectedZoom);
          setShowPlaceDropdown(false);
        } else {
          setPlaceResults(data.results);
          setShowPlaceDropdown(true);
        }
      } else {
        setPlaceResults([]);
        setCoordError(`No places found for "${query}". Try entering coordinates.`);
      }
    } catch (err: any) {
      setCoordError(err.message || 'Geocoding service error');
    } finally {
      setIsSearchingPlace(false);
    }
  };

  return (
    <>
      <header className="h-14 bg-[#0B1724] border-b border-[#233B54] px-4 flex items-center justify-between z-30 select-none">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#122436] to-[#1A3650] border border-[#56E6B2]/40 flex items-center justify-center shadow-md">
            <Mountain className="w-5 h-5 text-[#56E6B2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-100 text-sm tracking-wide">TerrainMap AI</span>
              <span className="text-[10px] bg-[#122436] text-[#56E6B2] border border-[#56E6B2]/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                GIS PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Verified Elevation & Raster Analytics</p>
          </div>

          {/* Dedicated Thematic Maps / LULC Switcher Button */}
          <button
            onClick={onOpenThematicLULC}
            title="Open Dedicated Land Use / Land Cover (LULC) Map Generator"
            className="ml-2 px-2.5 py-1 bg-gradient-to-r from-[#182C42] to-[#1F3D5C] hover:from-[#1E3753] hover:to-[#264D73] border border-[#56E6B2]/40 rounded text-xs font-semibold text-[#56E6B2] flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Thematic Maps:</span>
            <span>LULC Generator</span>
          </button>
        </div>

        {/* Dedicated Separate Latitude & Longitude Search Bar */}
        <div className="flex items-center space-x-2 mx-3 max-w-2xl w-full justify-center">
          {searchMode === 'latlng' ? (
            <form onSubmit={handleGoToCoordinates} className="flex items-center space-x-1.5 w-full max-w-lg">
              {/* Latitude Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!handleSmartPaste(val)) {
                      setLatInput(val);
                    }
                    if (coordError) setCoordError(null);
                  }}
                  placeholder="Latitude (e.g. 22.5726)"
                  className="w-full h-8 px-2.5 bg-[#122436] border border-[#233B54] rounded-md text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#56E6B2] focus:ring-1 focus:ring-[#56E6B2] transition-colors"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400 pointer-events-none font-mono">
                  Lat
                </span>
              </div>

              {/* Longitude Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!handleSmartPaste(val)) {
                      setLngInput(val);
                    }
                    if (coordError) setCoordError(null);
                  }}
                  placeholder="Longitude (e.g. 88.3639)"
                  className="w-full h-8 px-2.5 bg-[#122436] border border-[#233B54] rounded-md text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#56E6B2] focus:ring-1 focus:ring-[#56E6B2] transition-colors"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400 pointer-events-none font-mono">
                  Lng
                </span>
              </div>

              {/* Zoom Selector */}
              <select
                value={selectedZoom}
                onChange={(e) => setSelectedZoom(Number(e.target.value))}
                title="Select Map Zoom Level"
                className="h-8 bg-[#122436] border border-[#233B54] text-slate-200 text-xs rounded-md px-1.5 focus:outline-none focus:border-[#56E6B2]"
              >
                <option value={11}>z11 (Region)</option>
                <option value={13}>z13 (Local Area)</option>
                <option value={15}>z15 (Detail)</option>
                <option value={17}>z17 (Street/Peak)</option>
              </select>

              {/* Clearly Visible "Go to Location" Button */}
              <button
                type="submit"
                title="Navigate map directly to entered coordinates"
                className="h-8 px-3.5 bg-[#56E6B2] hover:bg-[#44d3a0] text-[#0B1724] font-bold rounded-md text-xs transition-colors flex items-center space-x-1.5 shrink-0 shadow-md cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Go to Location</span>
              </button>

              {/* Toggle to Place Name Search */}
              <button
                type="button"
                onClick={() => setSearchMode('place')}
                title="Switch to Place Name search"
                className="h-8 px-2 bg-[#182C42] hover:bg-[#223d5a] text-slate-300 rounded-md text-xs transition-colors border border-[#233B54]"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePlaceSearch} className="flex items-center space-x-1.5 w-full max-w-lg relative">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  placeholder="Search city, mountain peak, or region..."
                  className="w-full h-8 pl-8 pr-16 bg-[#122436] border border-[#233B54] rounded-md text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#56E6B2]"
                />
                <button
                  type="submit"
                  disabled={isSearchingPlace}
                  className="absolute right-1 top-1 px-2.5 py-1 bg-[#1A3650] hover:bg-[#244666] text-[#56E6B2] rounded text-[11px] font-medium"
                >
                  {isSearchingPlace ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Search'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSearchMode('latlng')}
                title="Switch to Latitude / Longitude input"
                className="h-8 px-2.5 bg-[#182C42] hover:bg-[#223d5a] text-[#56E6B2] rounded-md text-xs transition-colors border border-[#233B54] flex items-center space-x-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Lat/Lng</span>
              </button>

              {/* Place Results Dropdown */}
              {showPlaceDropdown && placeResults.length > 0 && (
                <div className="absolute top-10 left-0 right-16 bg-[#122436] border border-[#233B54] rounded-md shadow-2xl py-1 z-50 text-xs max-h-60 overflow-y-auto">
                  {placeResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        executeNavigation(item.lat, item.lng, selectedZoom);
                        setShowPlaceDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#1A3650] text-slate-200 flex items-start space-x-2 border-b border-[#1A3650]/40 last:border-none"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#56E6B2] mt-0.5 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium truncate">{item.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.lat.toFixed(5)}, {item.lng.toFixed(5)} ({formatDMS(item.lat, true)} {formatDMS(item.lng, false)})
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>
          )}

          {/* Coordinate error banner */}
          {coordError && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-rose-950/95 border border-rose-500/60 text-rose-200 px-3 py-1.5 rounded-md text-xs flex items-center space-x-2 shadow-xl z-50">
              <HelpCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{coordError}</span>
              <button onClick={() => setCoordError(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
            </div>
          )}
        </div>

        {/* Top Navigation Action Buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={onNewMap}
            title="Reset map view & new study"
            className="px-2.5 py-1.5 bg-[#122436] hover:bg-[#1A3650] text-slate-300 hover:text-slate-100 border border-[#233B54] rounded text-xs font-medium transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">New Map</span>
          </button>

          <button
            onClick={onOpenProjects}
            title="Saved Projects & Study Areas"
            className="px-2.5 py-1.5 bg-[#122436] hover:bg-[#1A3650] text-slate-300 hover:text-slate-100 border border-[#233B54] rounded text-xs font-medium transition-colors flex items-center space-x-1"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#56E6B2]" />
            <span className="hidden sm:inline">Projects</span>
          </button>

          <button
            onClick={onOpenDataSources}
            title="Verified DEM Data Sources & Datums"
            className="px-2.5 py-1.5 bg-[#122436] hover:bg-[#1A3650] text-slate-300 hover:text-slate-100 border border-[#233B54] rounded text-xs font-medium transition-colors flex items-center space-x-1"
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Sources</span>
          </button>

          <button
            onClick={onOpenDocs}
            title="GIS User Documentation"
            className="px-2.5 py-1.5 bg-[#122436] hover:bg-[#1A3650] text-slate-300 hover:text-slate-100 border border-[#233B54] rounded text-xs font-medium transition-colors flex items-center space-x-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Docs</span>
          </button>

          {/* Gemini AI Assistant Button */}
          <button
            onClick={onOpenAIAssistant}
            title="Terrain AI Assistant (Gemini 3.8 Flash)"
            className="px-2.5 py-1.5 bg-[#122436] hover:bg-[#183652] text-[#56E6B2] border border-[#56E6B2]/40 rounded text-xs font-medium transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI</span>
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExport}
            title="Export Map (PNG, PDF, GeoJSON, CSV, GeoTIFF)"
            className="px-3 py-1.5 bg-[#56E6B2] hover:bg-[#45d4a1] text-[#0B1724] font-semibold rounded text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Coordinate Input Modal */}
      <CoordinateInputModal
        isOpen={isCoordModalOpen}
        onClose={() => setIsCoordModalOpen(false)}
        onNavigateToCoordinates={(item) => executeNavigation(item.lat, item.lng, selectedZoom)}
        initialLat={currentCoordinates?.lat}
        initialLng={currentCoordinates?.lng}
      />
    </>
  );
};
