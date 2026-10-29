import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Activity,
  BarChart2,
  PieChart,
  FileText,
  Terminal,
  Maximize2,
  Minimize2,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  ProfileAnalysisResult,
  TerrainStatistics,
  ProcessedTerrainData,
  ProcessingJob,
  ElevationUnit
} from '../types/gis';
import { exportProfileCSV } from '../services/exportService';

interface BottomAnalysisPanelProps {
  profileResult: ProfileAnalysisResult | null;
  terrainData: ProcessedTerrainData | null;
  processingJob: ProcessingJob;
  elevationUnit: ElevationUnit;
  isProcessing: boolean;
}

type TabKey = 'profile' | 'statistics' | 'slope' | 'metadata' | 'logs';

export const BottomAnalysisPanel: React.FC<BottomAnalysisPanelProps> = ({
  profileResult,
  terrainData,
  processingJob,
  elevationUnit,
  isProcessing
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpandedFull, setIsExpandedFull] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const unitFactor = elevationUnit === 'feet' ? 3.28084 : 1;
  const unitLabel = elevationUnit === 'feet' ? 'ft' : 'm';

  // Format profile points for Recharts
  const chartProfileData = profileResult?.points.map(p => ({
    distKm: Number((p.distanceMeters / 1000).toFixed(2)),
    distMeters: p.distanceMeters,
    elevation: Math.round(p.elevation * unitFactor),
    slope: p.slopeDegrees
  })) || [];

  // Format elevation histogram for Recharts
  const chartHistogramData = terrainData?.statistics.elevationHistogram.map(b => ({
    label: `${Math.round(b.binStart * unitFactor)}-${Math.round(b.binEnd * unitFactor)}${unitLabel}`,
    count: b.count
  })) || [];

  // Format slope distribution for Recharts
  const chartSlopeData = terrainData?.statistics.slopeStats?.distribution || [];
  const slopeColors = ['#10B981', '#34D399', '#FBBF24', '#F97316', '#EF4444'];

  return (
    <div
      className={`bg-[#0E1C2B] border-t border-[#233B54] transition-all duration-300 flex flex-col z-30 select-none ${
        isCollapsed
          ? 'h-9'
          : isExpandedFull
          ? 'h-80'
          : 'h-60'
      }`}
    >
      {/* Top Header / Tab Bar */}
      <div className="h-9 px-3 bg-[#0B1724] border-b border-[#233B54] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1">
          {[
            { key: 'profile' as TabKey, label: 'Elevation Profile', icon: Activity, count: profileResult ? 'Active' : null },
            { key: 'statistics' as TabKey, label: 'Terrain Statistics', icon: BarChart2, count: terrainData ? 'Computed' : null },
            { key: 'slope' as TabKey, label: 'Slope Distribution', icon: PieChart, count: terrainData?.statistics.slopeStats ? 'Horn' : null },
            { key: 'metadata' as TabKey, label: 'Data Metadata', icon: FileText, count: null },
            { key: 'logs' as TabKey, label: 'Processing Logs', icon: Terminal, count: processingJob.logs.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`px-3 py-1 rounded text-xs flex items-center space-x-1.5 transition-colors ${
                  isActive
                    ? 'bg-[#182C42] text-[#56E6B2] border border-[#233B54] font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#122436]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="text-[9px] bg-[#122436] text-slate-300 px-1 py-0.2 rounded font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel Size Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpandedFull(!isExpandedFull)}
            className="p-1 hover:bg-[#182C42] text-slate-400 hover:text-slate-200 rounded"
            title={isExpandedFull ? 'Restore normal height' : 'Expand panel'}
          >
            {isExpandedFull ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-[#182C42] text-slate-400 hover:text-slate-200 rounded"
            title={isCollapsed ? 'Expand bottom drawer' : 'Collapse drawer'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden p-3 bg-[#0E1C2B]">
          {/* TAB 1: Elevation Profile */}
          {activeTab === 'profile' && (
            <div className="w-full h-full flex flex-col">
              {profileResult ? (
                <div className="w-full h-full flex flex-col md:flex-row gap-3">
                  {/* Left stats bar */}
                  <div className="md:w-64 bg-[#122436] p-2.5 rounded border border-[#233B54] flex flex-col justify-between shrink-0 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-[#233B54]">
                        <span className="font-semibold text-slate-200">Profile Metrics</span>
                        <button
                          onClick={() => exportProfileCSV(profileResult)}
                          title="Export profile measurements to CSV"
                          className="text-[10px] text-[#56E6B2] hover:underline flex items-center space-x-0.5"
                        >
                          <Download className="w-3 h-3" />
                          <span>CSV</span>
                        </button>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Distance:</span>
                          <span className="text-slate-100">
                            {(profileResult.totalDistanceMeters / 1000).toFixed(2)} km ({(profileResult.totalDistanceMeters * 0.000621371).toFixed(2)} mi)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Min Elevation:</span>
                          <span className="text-slate-100">{Math.round(profileResult.minElevation * unitFactor)} {unitLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Max Elevation:</span>
                          <span className="text-[#56E6B2] font-semibold">{Math.round(profileResult.maxElevation * unitFactor)} {unitLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Climb:</span>
                          <span className="text-emerald-400">+{Math.round(profileResult.elevationGain * unitFactor)} {unitLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Descent:</span>
                          <span className="text-rose-400">-{Math.round(profileResult.elevationLoss * unitFactor)} {unitLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Average Grade:</span>
                          <span className="text-slate-100">{profileResult.averageSlope}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Max Gradient:</span>
                          <span className="text-amber-400 font-semibold">{profileResult.maxSlope}°</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-[#233B54]">
                      Dataset: {profileResult.dataset}
                    </div>
                  </div>

                  {/* Right: Recharts Interactive Area Chart */}
                  <div className="flex-1 h-full min-h-[140px] bg-[#122436] p-2 rounded border border-[#233B54]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartProfileData} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#56E6B2" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#122436" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1D3249" />
                        <XAxis
                          dataKey="distKm"
                          stroke="#64748B"
                          tick={{ fontSize: 10, fill: '#94A3B8' }}
                          tickFormatter={(v) => `${v} km`}
                        />
                        <YAxis
                          stroke="#64748B"
                          tick={{ fontSize: 10, fill: '#94A3B8' }}
                          domain={['auto', 'auto']}
                          tickFormatter={(v) => `${v} ${unitLabel}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0B1724',
                            borderColor: '#233B54',
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: '#F1F5F9'
                          }}
                          formatter={(value: any, name: any) => [
                            `${value} ${unitLabel}`,
                            'Elevation'
                          ]}
                          labelFormatter={(label) => `Distance: ${label} km`}
                        />
                        <Area
                          type="monotone"
                          dataKey="elevation"
                          stroke="#56E6B2"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#elevGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-[#233B54] rounded-md">
                  <Activity className="w-6 h-6 text-slate-500 mb-1" />
                  <p className="text-xs font-medium text-slate-300">No Elevation Profile Drawn</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Click "Profile Line" in the map toolbar and draw a path across any mountain or valley to sample real terrain cross-section.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Terrain Statistics */}
          {activeTab === 'statistics' && (
            <div className="w-full h-full flex flex-col md:flex-row gap-3">
              {terrainData ? (
                <>
                  <div className="md:w-72 bg-[#122436] p-2.5 rounded border border-[#233B54] space-y-1.5 text-xs font-mono shrink-0">
                    <span className="font-semibold text-slate-200 block border-b border-[#233B54] pb-1 text-xs font-sans">
                      Grid Raster Statistics
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min Elevation:</span>
                      <span className="text-slate-200">{Math.round(terrainData.statistics.minElevation * unitFactor)} {unitLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Elevation:</span>
                      <span className="text-[#56E6B2] font-semibold">{Math.round(terrainData.statistics.maxElevation * unitFactor)} {unitLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vertical Relief:</span>
                      <span className="text-slate-200">{Math.round(terrainData.statistics.elevationRange * unitFactor)} {unitLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mean Elevation:</span>
                      <span className="text-slate-200">{Math.round(terrainData.statistics.meanElevation * unitFactor)} {unitLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Std Deviation:</span>
                      <span className="text-slate-200">±{Math.round(terrainData.statistics.stdDevElevation * unitFactor)} {unitLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valid Cells:</span>
                      <span className="text-slate-200">{terrainData.statistics.validCellsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Surface Area:</span>
                      <span className="text-[#56E6B2] font-semibold">{terrainData.statistics.surfaceAreaKm2} km²</span>
                    </div>
                  </div>

                  {/* Elevation Histogram */}
                  <div className="flex-1 h-full bg-[#122436] p-2 rounded border border-[#233B54] flex flex-col">
                    <div className="text-[10px] text-slate-400 font-mono mb-1">
                      Hypsometric Distribution Histogram (Cell Counts per Elevation Band)
                    </div>
                    <div className="flex-1 w-full min-h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartHistogramData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1D3249" />
                          <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                          <YAxis stroke="#64748B" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0B1724',
                              borderColor: '#233B54',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: '#F1F5F9'
                            }}
                          />
                          <Bar dataKey="count" fill="#38BDF8" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-[#233B54] rounded-md">
                  <BarChart2 className="w-6 h-6 text-slate-500 mb-1" />
                  <p className="text-xs font-medium text-slate-300">No Terrain Raster Processed</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Click "Process Selected AOI" in the sidebar to compute real DEM statistics and hypsometry.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Slope Distribution */}
          {activeTab === 'slope' && (
            <div className="w-full h-full flex flex-col md:flex-row gap-3">
              {terrainData?.statistics.slopeStats ? (
                <>
                  <div className="md:w-64 bg-[#122436] p-2.5 rounded border border-[#233B54] space-y-1.5 text-xs font-mono shrink-0">
                    <span className="font-semibold text-slate-200 block border-b border-[#233B54] pb-1 text-xs font-sans">
                      Horn's Slope Gradient
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mean Slope:</span>
                      <span className="text-slate-200">{terrainData.statistics.slopeStats.meanSlopeDeg}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Slope:</span>
                      <span className="text-rose-400 font-semibold">{terrainData.statistics.slopeStats.maxSlopeDeg}°</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-[#233B54]">
                      Algorithm: Horn (1981) 3x3 finite-difference weighted gradient with geodesic metric cell spacing.
                    </div>
                  </div>

                  <div className="flex-1 h-full bg-[#122436] p-2 rounded border border-[#233B54] flex flex-col">
                    <div className="text-[10px] text-slate-400 font-mono mb-1">
                      Slope Classification Distribution (% Area)
                    </div>
                    <div className="flex-1 w-full min-h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartSlopeData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1D3249" />
                          <XAxis dataKey="range" stroke="#64748B" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                          <YAxis stroke="#64748B" tick={{ fontSize: 9, fill: '#94A3B8' }} unit="%" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0B1724',
                              borderColor: '#233B54',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: '#F1F5F9'
                            }}
                            formatter={(val: any, name: any, item: any) => [
                              `${val}% (${item.payload.label})`,
                              'Area Share'
                            ]}
                          />
                          <Bar dataKey="percentage" radius={[2, 2, 0, 0]}>
                            {chartSlopeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={slopeColors[index % slopeColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-[#233B54] rounded-md">
                  <PieChart className="w-6 h-6 text-slate-500 mb-1" />
                  <p className="text-xs font-medium text-slate-300">Slope Distribution Not Yet Computed</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Run terrain processing to calculate slopes using Horn's partial derivative matrix.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Data Metadata */}
          {activeTab === 'metadata' && (
            <div className="w-full h-full bg-[#122436] p-3 rounded border border-[#233B54] overflow-y-auto text-xs space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5 bg-[#0E1C2B] p-2.5 rounded border border-[#233B54]">
                  <h4 className="font-semibold text-[#56E6B2] text-xs">Primary DEM Sources</h4>
                  <p className="text-slate-300">
                    <strong className="text-slate-100">Copernicus DEM (GLO-30):</strong> High-accuracy global Digital Surface Model generated from the TanDEM-X mission, distributed by the European Space Agency (ESA).
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-slate-100">USGS 3DEP:</strong> 3D Elevation Program 1/3 arc-second DEM (~10m) covering contiguous US, Alaska, and Hawaii via National Map EPQS.
                  </p>
                </div>

                <div className="space-y-1.5 bg-[#0E1C2B] p-2.5 rounded border border-[#233B54]">
                  <h4 className="font-semibold text-[#38BDF8] text-xs">Coordinate Reference Systems</h4>
                  <p className="text-slate-300">
                    <strong className="text-slate-100">Horizontal CRS:</strong> EPSG:4326 (WGS 84 2D Geographic Coordinates) and EPSG:3857 (Web Mercator for basemap display).
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-slate-100">Vertical Datum:</strong> EGM96 Geoid (global Copernicus/SRTM) and NAVD88 Orthometric (USGS 3DEP).
                  </p>
                </div>
              </div>

              <div className="bg-[#0E1C2B] p-2.5 rounded border border-[#233B54] text-[11px] text-slate-400">
                <p className="font-medium text-slate-200 mb-0.5">Scientific & Legal Disclaimer:</p>
                <p>
                  All measurements presented in TerrainMap AI reflect published government and academic satellite radar datasets. Digital surface models include vegetation canopy and man-made structures in forested or urban terrain.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Processing Logs */}
          {activeTab === 'logs' && (
            <div className="w-full h-full bg-[#08111A] p-2.5 rounded border border-[#233B54] font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1">
              <div className="text-[10px] text-[#56E6B2] font-semibold mb-1">
                [Terrain Processing Engine Status: {processingJob.status.toUpperCase()}]
              </div>
              {processingJob.logs.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-slate-500 shrink-0">&gt;</span>
                  <span className={log.includes('Error') ? 'text-rose-400' : log.includes('Success') || log.includes('completed') ? 'text-[#56E6B2]' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
              {processingJob.logs.length === 0 && (
                <div className="text-slate-500 italic">No processing tasks initiated yet. Ready for commands.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
