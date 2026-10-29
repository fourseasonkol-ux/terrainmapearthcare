import React, { useState } from 'react';
import {
  Layers,
  Sliders,
  Sun,
  TrendingUp,
  Map,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Play,
  RotateCcw,
  Check,
  Compass,
  TreePine,
  Sparkles
} from 'lucide-react';
import {
  BasemapId,
  MapLayerState,
  ElevationSettings,
  ContourSettings,
  HillshadeSettings,
  SlopeSettings,
  ProcessingJob
} from '../types/gis';
import { LULC_CLASSES, LULC_DATASETS } from '../services/lulcService';

interface LeftSidebarProps {
  basemap: BasemapId;
  onBasemapChange: (b: BasemapId) => void;
  layers: MapLayerState;
  onToggleLayer: (key: keyof MapLayerState) => void;
  elevationSettings: ElevationSettings;
  onElevationSettingsChange: (s: ElevationSettings) => void;
  contourSettings: ContourSettings;
  onContourSettingsChange: (c: ContourSettings) => void;
  hillshadeSettings: HillshadeSettings;
  onHillshadeSettingsChange: (h: HillshadeSettings) => void;
  slopeSettings: SlopeSettings;
  onSlopeSettingsChange: (s: SlopeSettings) => void;
  activeDataSource: string;
  onDataSourceChange: (src: string) => void;
  processingJob: ProcessingJob;
  onRunTerrainProcessing: () => void;
  hasAOI: boolean;
  onOpenThematicLULC?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  basemap,
  onBasemapChange,
  layers,
  onToggleLayer,
  elevationSettings,
  onElevationSettingsChange,
  contourSettings,
  onContourSettingsChange,
  hillshadeSettings,
  onHillshadeSettingsChange,
  slopeSettings,
  onSlopeSettingsChange,
  activeDataSource,
  onDataSourceChange,
  processingJob,
  onRunTerrainProcessing,
  hasAOI,
  onOpenThematicLULC
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basemaps: true,
    layers: true,
    lulc: true,
    contours: false,
    hillshade: false,
    slope: false,
    elevation: false,
    data: false
  });

  // LULC Quick overlay state
  const [isLulcOverlayActive, setIsLulcOverlayActive] = useState(false);
  const [lulcOpacity, setLulcOpacity] = useState(0.75);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // All 8 required basemap options with visual thumbnails
  const basemapOptions: { id: BasemapId; label: string; desc: string; badge: string; previewBg: string }[] = [
    { id: 'streets', label: 'Street Map', desc: 'Esri World Street Map', badge: 'Vector', previewBg: 'from-amber-900/60 to-emerald-950/80' },
    { id: 'satellite', label: 'Satellite', desc: 'Esri World Imagery (High-Res)', badge: 'Aerial', previewBg: 'from-sky-950/80 to-emerald-950/90' },
    { id: 'terrain', label: 'Terrain Relief', desc: 'OpenTopoMap shaded relief', badge: 'SRTM', previewBg: 'from-amber-950/80 to-stone-900/90' },
    { id: 'hybrid', label: 'Hybrid', desc: 'Satellite + Boundaries/Places', badge: 'Overlay', previewBg: 'from-cyan-950/80 to-emerald-900/80' },
    { id: 'topo', label: 'Topographic', desc: 'OpenTopoMap contours & trails', badge: 'Topo', previewBg: 'from-emerald-950/80 to-amber-900/70' },
    { id: 'light', label: 'Carto Light', desc: 'Clean Positron styling', badge: 'Minimal', previewBg: 'from-slate-700/60 to-slate-800/80' },
    { id: 'dark', label: 'Carto Dark', desc: 'Dark Matter high contrast', badge: 'GIS Pro', previewBg: 'from-black to-slate-950' },
    { id: 'osm', label: 'OpenStreetMap', desc: 'Standard OSM crowd-sourced', badge: 'OSM', previewBg: 'from-blue-950/70 to-emerald-950/70' }
  ];

  return (
    <aside className="w-80 h-full bg-[#122436] border-r border-[#233B54] flex flex-col overflow-hidden select-none shrink-0 z-20">
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-[#233B54] flex items-center justify-between bg-[#0E1C2B]">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#56E6B2]" />
          <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">Map Controls & Layers</h2>
        </div>
        <span className="text-[10px] bg-[#1A3650] text-[#56E6B2] px-1.5 py-0.5 rounded font-mono">
          8 Basemaps
        </span>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1D3249] text-xs">
        {/* 1. Basemap Selector (Compact 2-Column Grid with Thumbnails) */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('basemaps')}
            className="w-full flex items-center justify-between text-slate-200 font-semibold mb-2 hover:text-[#56E6B2]"
          >
            <div className="flex items-center space-x-2">
              <Map className="w-3.5 h-3.5 text-[#56E6B2]" />
              <span>Basemaps (8 Styles)</span>
            </div>
            {openSections.basemaps ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.basemaps && (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {basemapOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onBasemapChange(opt.id)}
                  className={`text-left p-2 rounded-md transition-all border flex flex-col justify-between relative overflow-hidden group ${
                    basemap === opt.id
                      ? 'bg-[#1F3D5C] text-[#56E6B2] border-[#56E6B2]/60 shadow-md ring-1 ring-[#56E6B2]/40'
                      : 'bg-[#182C42] hover:bg-[#1E3753] text-slate-300 border-[#233B54]'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${opt.previewBg} opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none`} />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold truncate">{opt.label}</span>
                      {basemap === opt.id && <Check className="w-3 h-3 text-[#56E6B2] shrink-0" />}
                    </div>
                    <p className="text-[9px] text-slate-400 truncate">{opt.desc}</p>
                  </div>

                  <span className="relative z-10 mt-1.5 text-[8px] self-start bg-[#0E1C2B]/80 text-slate-300 px-1 py-0.2 rounded font-mono">
                    {opt.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Dedicated Land Use / Land Cover (LULC) Map Filters */}
        <div className="p-3 bg-[#15283C]/40">
          <button
            onClick={() => toggleSection('lulc')}
            className="w-full flex items-center justify-between text-slate-200 font-semibold mb-2 hover:text-[#56E6B2]"
          >
            <div className="flex items-center space-x-2">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Land Use / Land Cover (LULC)</span>
            </div>
            {openSections.lulc ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.lulc && (
            <div className="space-y-2.5 pt-1">
              {/* LULC Full Poster Generator Launch Button */}
              {onOpenThematicLULC && (
                <button
                  onClick={onOpenThematicLULC}
                  className="w-full py-1.5 px-2 bg-gradient-to-r from-emerald-600/30 to-sky-600/30 hover:from-emerald-600/50 hover:to-sky-600/50 border border-emerald-500/40 rounded text-[11px] font-semibold text-emerald-300 flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Professional LULC Poster Generator</span>
                </button>
              )}

              {/* Standard Classification Legend & Swatches */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block mb-1">
                  Verified Land-Cover Classes (ESA / Dynamic World):
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {LULC_CLASSES.map(cls => (
                    <div
                      key={cls.id}
                      className="flex items-center space-x-1.5 p-1 bg-[#182C42] rounded border border-[#233B54]"
                    >
                      <span
                        className="w-3 h-3 rounded-xs shrink-0 border border-black/30"
                        style={{ backgroundColor: cls.color }}
                      />
                      <span className="text-slate-200 truncate">{cls.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#182C42] p-2 rounded text-[10px] text-slate-400 border border-[#233B54] space-y-0.5 font-mono">
                <div>Source: ESA WorldCover 10m & GEE Dynamic World</div>
                <div className="text-emerald-400">Resolution: 10m Ground Pixel • WGS 84</div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Map Layer Visibility Stack */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('layers')}
            className="w-full flex items-center justify-between text-slate-200 font-semibold mb-2 hover:text-[#56E6B2]"
          >
            <div className="flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-[#56E6B2]" />
              <span>Map Layer Stack</span>
            </div>
            {openSections.layers ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.layers && (
            <div className="space-y-1.5 pt-1">
              {[
                { key: 'contours' as const, label: 'Contour Lines (Vector)', badge: 'Marching Sq' },
                { key: 'elevationRelief' as const, label: 'Elevation Color Relief', badge: 'DEM' },
                { key: 'hillshade' as const, label: 'Hillshade Illumination', badge: 'Raster' },
                { key: 'slope' as const, label: 'Slope Gradient Map', badge: 'Horn' },
                { key: 'aspect' as const, label: 'Aspect (Facing Direction)', badge: 'Compass' },
                { key: 'userDrawings' as const, label: 'AOI & Profile Drawings', badge: 'Vector' }
              ].map(layer => (
                <div
                  key={layer.key}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-[#182C42] rounded border border-[#233B54]"
                >
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggleLayer(layer.key)}
                      className={`p-1 rounded ${layers[layer.key] ? 'text-[#56E6B2]' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {layers[layer.key] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`text-[11px] ${layers[layer.key] ? 'text-slate-200 font-medium' : 'text-slate-400 line-through'}`}>
                      {layer.label}
                    </span>
                  </div>
                  <span className="text-[9px] bg-[#122436] text-slate-400 px-1 py-0.5 rounded font-mono">
                    {layer.badge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Contour Line Settings */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('contours')}
            className="w-full flex items-center justify-between text-slate-200 font-semibold mb-2 hover:text-[#56E6B2]"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-[#56E6B2]" />
              <span>Contour Settings</span>
            </div>
            {openSections.contours ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.contours && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Contour Interval</span>
                  <span className="text-[#56E6B2] font-mono font-medium">{contourSettings.interval} {contourSettings.unit}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[10, 20, 50, 100].map(val => (
                    <button
                      key={val}
                      onClick={() => onContourSettingsChange({ ...contourSettings, interval: val })}
                      className={`py-1 rounded text-[10px] font-mono font-medium transition-colors ${
                        contourSettings.interval === val
                          ? 'bg-[#56E6B2] text-[#0B1724]'
                          : 'bg-[#182C42] text-slate-300 hover:bg-[#1E3753]'
                      }`}
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 mb-1 block">Index Contours (Bold line)</label>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">Every</span>
                  <select
                    value={contourSettings.indexContourInterval}
                    onChange={(e) => onContourSettingsChange({ ...contourSettings, indexContourInterval: Number(e.target.value) })}
                    className="bg-[#182C42] border border-[#233B54] rounded px-2 py-0.5 text-slate-200 text-xs font-mono"
                  >
                    <option value={4}>4th contour</option>
                    <option value={5}>5th contour (Standard USGS)</option>
                    <option value={10}>10th contour</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Hillshade Settings */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('hillshade')}
            className="w-full flex items-center justify-between text-slate-200 font-semibold mb-2 hover:text-[#56E6B2]"
          >
            <div className="flex items-center space-x-2">
              <Sun className="w-3.5 h-3.5 text-[#56E6B2]" />
              <span>Hillshade Illumination</span>
            </div>
            {openSections.hillshade ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.hillshade && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Sun Azimuth</span>
                  <span className="text-[#56E6B2] font-mono">{hillshadeSettings.azimuth}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={hillshadeSettings.azimuth}
                  onChange={(e) => onHillshadeSettingsChange({ ...hillshadeSettings, azimuth: Number(e.target.value) })}
                  className="w-full accent-[#56E6B2] h-1.5 bg-[#182C42] rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Vertical Exaggeration</span>
                  <span className="text-[#56E6B2] font-mono">{hillshadeSettings.verticalExaggeration.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.2"
                  value={hillshadeSettings.verticalExaggeration}
                  onChange={(e) => onHillshadeSettingsChange({ ...hillshadeSettings, verticalExaggeration: Number(e.target.value) })}
                  className="w-full accent-[#56E6B2] h-1.5 bg-[#182C42] rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. Slope Analysis Settings */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('slope')}
            className="w-full flex items-center justify-between text-slate-200 font-semibold mb-2 hover:text-[#56E6B2]"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#56E6B2]" />
              <span>Slope Gradient (Horn's Method)</span>
            </div>
            {openSections.slope ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.slope && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-300 mb-1 block">Slope Units</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['degrees', 'percent'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => onSlopeSettingsChange({ ...slopeSettings, unit: u })}
                      className={`py-1 rounded text-[11px] capitalize font-medium ${
                        slopeSettings.unit === u
                          ? 'bg-[#56E6B2] text-[#0B1724]'
                          : 'bg-[#182C42] text-slate-300 hover:bg-[#1E3753]'
                      }`}
                    >
                      {u === 'degrees' ? 'Degrees (°)' : 'Percent (%)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. Data Source & CRS Information */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('data')}
            className="w-full flex items-center justify-between text-slate-200 font-semibold mb-2 hover:text-[#56E6B2]"
          >
            <div className="flex items-center space-x-2">
              <Compass className="w-3.5 h-3.5 text-[#56E6B2]" />
              <span>Data Settings & Provenance</span>
            </div>
            {openSections.data ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.data && (
            <div className="space-y-2 pt-1 text-[11px]">
              <div>
                <label className="text-slate-400 block mb-1">Active Elevation Source</label>
                <select
                  value={activeDataSource}
                  onChange={(e) => onDataSourceChange(e.target.value)}
                  className="w-full bg-[#182C42] border border-[#233B54] rounded px-2 py-1 text-slate-200 text-xs"
                >
                  <option value="Copernicus GLO-30 DSM">Copernicus GLO-30 DSM (Global 30m)</option>
                  <option value="USGS 3DEP 1/3 arc-sec">USGS 3DEP (~10m US National Map)</option>
                  <option value="SRTM 30m">SRTM v3.0 (NASA Shuttle Radar)</option>
                </select>
              </div>

              <div className="bg-[#182C42] p-2 rounded border border-[#233B54] space-y-1 text-[10px] text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Horizontal CRS:</span>
                  <span className="text-[#56E6B2]">EPSG:4326 (WGS 84)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vertical Datum:</span>
                  <span>EGM96 Geoid / NAVD88</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer Action */}
      <div className="p-3 border-t border-[#233B54] bg-[#0E1C2B]">
        <button
          onClick={onRunTerrainProcessing}
          disabled={processingJob.status === 'running'}
          className={`w-full py-2.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md ${
            processingJob.status === 'running'
              ? 'bg-[#1F3D5C] text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#56E6B2] to-[#38BDF8] text-[#0B1724] hover:opacity-95 cursor-pointer'
          }`}
        >
          {processingJob.status === 'running' ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              <span>Processing DEM Raster...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{hasAOI ? 'Process Selected AOI' : 'Analyze Current Terrain'}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
