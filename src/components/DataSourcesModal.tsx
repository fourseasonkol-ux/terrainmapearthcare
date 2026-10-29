import React from 'react';
import { X, Database, Globe, CheckCircle2, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#122436] border border-[#233B54] rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#233B54] flex items-center justify-between bg-[#0B1724]">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Verified Elevation Data Sources & Datums</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Scientific rigor banner */}
          <div className="bg-[#0E1C2B] p-3 rounded border border-[#56E6B2]/30 flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-[#56E6B2] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-100 text-xs">Zero-Fabrication Data Architecture</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                TerrainMap AI never synthesizes or hallucinates elevation numbers. All coordinates, contours, slopes, and statistics originate from validated geospatial APIs, satellite radar missions, and national geological surveys.
              </p>
            </div>
          </div>

          {/* Providers List */}
          <div className="space-y-3">
            {/* 1. Copernicus DEM */}
            <div className="bg-[#182C42] border border-[#233B54] rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-semibold text-slate-100 text-xs">Copernicus DEM (GLO-30 & GLO-90)</h4>
                </div>
                <span className="text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                  Primary Global DEM
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Provided by the European Space Agency (ESA) and Airbus Defence and Space under the European Union Copernicus Programme. Generated from TanDEM-X interferometric X-band radar.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[10px] text-slate-300">
                <div className="bg-[#122436] p-1.5 rounded">
                  <span className="text-slate-500 block">Coverage</span>
                  <span>Global (landmasses)</span>
                </div>
                <div className="bg-[#122436] p-1.5 rounded">
                  <span className="text-slate-500 block">Resolution</span>
                  <span>30 meters (GLO-30)</span>
                </div>
                <div className="bg-[#122436] p-1.5 rounded">
                  <span className="text-slate-500 block">Model Type</span>
                  <span>Digital Surface Model (DSM)</span>
                </div>
                <div className="bg-[#122436] p-1.5 rounded">
                  <span className="text-slate-500 block">Vertical Datum</span>
                  <span>EGM96 Geoid</span>
                </div>
              </div>
            </div>

            {/* 2. USGS 3DEP */}
            <div className="bg-[#182C42] border border-[#233B54] rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <h4 className="font-semibold text-slate-100 text-xs">USGS 3D Elevation Program (3DEP)</h4>
                </div>
                <span className="text-[10px] bg-sky-950/70 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono">
                  US National Map
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                United States Geological Survey authoritative high-resolution elevation products derived from airborne LiDAR and photogrammetry.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[10px] text-slate-300">
                <div className="bg-[#122436] p-1.5 rounded">
                  <span className="text-slate-500 block">Coverage</span>
                  <span>USA, AK, HI, PR</span>
                </div>
                <div className="bg-[#122436] p-1.5 rounded">
                  <span className="text-slate-500 block">Resolution</span>
                  <span>1/3 arc-sec (~10m)</span>
                </div>
                <div className="bg-[#122436] p-1.5 rounded">
                  <span className="text-slate-500 block">Model Type</span>
                  <span>Digital Terrain Model (Bare Earth)</span>
                </div>
                <div className="bg-[#122436] p-1.5 rounded">
                  <span className="text-slate-500 block">Vertical Datum</span>
                  <span>NAVD88 Orthometric</span>
                </div>
              </div>
            </div>

            {/* 3. Google Maps Elevation API */}
            <div className="bg-[#182C42] border border-[#233B54] rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <h4 className="font-semibold text-slate-100 text-xs">Google Maps Platform Elevation API</h4>
                </div>
                <span className="text-[10px] bg-amber-950/70 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                  API Key Enabled
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Synthesized multi-source elevation service returning exact elevations and query resolutions for coordinates along paths.
              </p>
            </div>

            {/* 4. DTM vs DSM Guide */}
            <div className="bg-[#182C42] border border-[#233B54] rounded p-3 space-y-1.5">
              <h4 className="font-semibold text-slate-100 text-xs">Digital Terrain Model (DTM) vs Digital Surface Model (DSM)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                • <strong>DTM (Bare Earth):</strong> Represents the true topographic ground surface with vegetation, buildings, and man-made structures removed (e.g. USGS 3DEP LiDAR).
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                • <strong>DSM (Surface Model):</strong> Reflects the highest reflective elevation surface captured by radar or optical sensors, including forest canopies and structures (e.g. Copernicus GLO-30).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#233B54] bg-[#0B1724] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#182C42] hover:bg-[#223d5a] text-slate-200 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
