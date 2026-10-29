import React from 'react';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
  Maximize2,
  Activity,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { PointElevationResult, AreaOfInterest, ProfileAnalysisResult } from '../types/gis';
import { formatDMS } from '../services/geoUtils';
import { exportPointCSV } from '../services/exportService';

interface RightInspectorProps {
  point: PointElevationResult | null;
  aoi: AreaOfInterest | null;
  profile: ProfileAnalysisResult | null;
  isLoadingPoint: boolean;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  point,
  aoi,
  profile,
  isLoadingPoint
}) => {
  return (
    <aside className="w-80 h-full bg-[#122436] border-l border-[#233B54] flex flex-col overflow-hidden select-none shrink-0 z-20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#233B54] flex items-center justify-between bg-[#0E1C2B]">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-[#56E6B2]" />
          <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">Geospatial Inspector</h2>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Real Elevation</span>
      </div>

      {/* Main Inspector Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Point Elevation Section */}
        <div className="bg-[#182C42] rounded-md border border-[#233B54] p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#233B54]">
            <span className="font-semibold text-slate-200 text-xs">Point Elevation Query</span>
            {point?.status === 'OK' && (
              <span className="text-[10px] bg-emerald-950/60 text-[#56E6B2] border border-[#56E6B2]/30 px-1.5 py-0.5 rounded font-mono font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            )}
            {point?.status === 'UNAVAILABLE' && (
              <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                No Data
              </span>
            )}
          </div>

          {isLoadingPoint ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <div className="w-5 h-5 border-2 border-[#56E6B2] border-t-transparent rounded-full animate-spin" />
              <p className="text-[11px]">Querying verified elevation APIs...</p>
            </div>
          ) : point ? (
            <div className="space-y-2.5">
              {/* Primary Measured Elevation Banner */}
              <div className="bg-[#0E1C2B] p-2.5 rounded border border-[#233B54]">
                <div className="text-[10px] text-slate-400 mb-0.5">Measured Elevation:</div>
                {point.status === 'OK' ? (
                  <div>
                    <div className="text-xl font-bold font-mono text-[#56E6B2]">
                      {point.elevation.toFixed(1)} <span className="text-sm font-normal text-slate-300">m</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {(point.elevation * 3.28084).toFixed(1)} <span className="text-[10px]">ft above datum</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-medium text-amber-400 flex items-center space-x-1.5 py-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Elevation unavailable</span>
                  </div>
                )}
              </div>

              {/* Coordinates */}
              <div className="space-y-1 bg-[#122436] p-2 rounded text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Latitude:</span>
                  <span className="text-slate-200">{point.latitude.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Longitude:</span>
                  <span className="text-slate-200">{point.longitude.toFixed(6)}°</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-0.5 border-t border-[#1D3249]">
                  DMS: {formatDMS(point.latitude, true)} {formatDMS(point.longitude, false)}
                </div>
              </div>

              {/* Verified Provenance Details */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between border-b border-[#233B54]/40 pb-1">
                  <span className="text-slate-400">Data Provider:</span>
                  <span className="text-slate-200 font-medium text-right max-w-[170px] truncate" title={point.provider}>
                    {point.provider}
                  </span>
                </div>

                <div className="flex justify-between border-b border-[#233B54]/40 pb-1">
                  <span className="text-slate-400">Source Dataset:</span>
                  <span className="text-slate-200 text-right max-w-[170px] truncate" title={point.dataset}>
                    {point.dataset}
                  </span>
                </div>

                <div className="flex justify-between border-b border-[#233B54]/40 pb-1">
                  <span className="text-slate-400">Resolution:</span>
                  <span className="text-slate-200 text-right">{point.resolution}</span>
                </div>

                <div className="flex justify-between border-b border-[#233B54]/40 pb-1">
                  <span className="text-slate-400">Vertical Datum:</span>
                  <span className="text-slate-200 text-right">{point.datum}</span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Query Latency: {point.retrievalTimeMs} ms</span>
                  </div>
                  <button
                    onClick={() => exportPointCSV(point)}
                    title="Export Point Elevation as CSV"
                    className="p-1 hover:text-[#56E6B2] text-slate-400 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notes / Quality statement */}
              {point.notes && (
                <div className="bg-[#122436] p-2 rounded text-[10px] text-slate-400 flex items-start space-x-1.5 border border-[#233B54]/60">
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{point.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5 text-slate-400">
              <MapPin className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-medium text-slate-300">Click anywhere on the map</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Inspects real elevation from Copernicus DEM, USGS 3DEP, or Google Elevation
              </p>
            </div>
          )}
        </div>

        {/* Area of Interest (AOI) Summary Card */}
        {aoi && (
          <div className="bg-[#182C42] rounded-md border border-[#233B54] p-3 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 pb-1.5 border-b border-[#233B54]">
              <Maximize2 className="w-3.5 h-3.5 text-[#56E6B2]" />
              <span className="font-semibold text-slate-200 text-xs">Active Study Area (AOI)</span>
            </div>

            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Surface Area:</span>
                <span className="text-[#56E6B2] font-semibold">{aoi.areaKm2?.toFixed(2)} km²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Acres:</span>
                <span className="text-slate-200">{((aoi.areaKm2 || 0) * 247.105).toFixed(1)} ac</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-[#1D3249]">
                BBox: [{aoi.bbox.map(n => n.toFixed(3)).join(', ')}]
              </div>
            </div>
          </div>
        )}

        {/* Drawn Profile Line Summary Card */}
        {profile && (
          <div className="bg-[#182C42] rounded-md border border-[#233B54] p-3 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 pb-1.5 border-b border-[#233B54]">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200 text-xs">Drawn Profile Path</span>
            </div>

            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Length:</span>
                <span className="text-amber-400 font-semibold">
                  {(profile.totalDistanceMeters / 1000).toFixed(2)} km ({(profile.totalDistanceMeters * 0.000621371).toFixed(2)} mi)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Elevation Range:</span>
                <span className="text-slate-200">
                  {profile.minElevation}m – {profile.maxElevation}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Elevation Gain:</span>
                <span className="text-emerald-400">+{profile.elevationGain}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Gradient:</span>
                <span className="text-rose-400">{profile.maxSlope}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Instructions & GIS Rules */}
        <div className="bg-[#122436]/70 p-2.5 rounded border border-[#233B54]/60 text-[10px] text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">Geospatial Principles:</p>
          <p>• Elevations are direct measurements, never interpolated artistic contours.</p>
          <p>• Geodesic formulas calculate true distance on the WGS 84 ellipsoid.</p>
        </div>
      </div>
    </aside>
  );
};
