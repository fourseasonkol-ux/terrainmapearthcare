import React from 'react';
import { X, BookOpen, Map, Compass, Activity, FileText, CheckCircle2 } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#122436] border border-[#233B54] rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#233B54] flex items-center justify-between bg-[#0B1724]">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#56E6B2]" />
            <h3 className="font-semibold text-slate-100 text-sm">GIS User Manual & Methodology</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto leading-relaxed">
          {/* Section 1: Overview */}
          <div className="space-y-1.5 bg-[#182C42] p-3 rounded border border-[#233B54]">
            <h4 className="font-semibold text-[#56E6B2] text-xs flex items-center space-x-1.5">
              <Map className="w-3.5 h-3.5" />
              <span>1. Overview & Geospatial Integrity</span>
            </h4>
            <p className="text-slate-300">
              TerrainMap AI is an interactive geospatial analytics suite designed for surveyors, civil engineers, alpine researchers, environmental planners, and GIS specialists.
            </p>
            <p className="text-slate-300">
              Unlike AI image generators that invent imaginary landscapes, every contour line, slope percentage, and elevation sample is computed directly on real Digital Elevation Model (DEM) grids from Copernicus GLO-30 and USGS 3DEP.
            </p>
          </div>

          {/* Section 2: Contours */}
          <div className="space-y-1.5 bg-[#182C42] p-3 rounded border border-[#233B54]">
            <h4 className="font-semibold text-[#38BDF8] text-xs flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>2. Interpreting Contour Lines</span>
            </h4>
            <p className="text-slate-300">
              Contour lines connect points of equal elevation above a vertical datum (EGM96 geoid or NAVD88).
            </p>
            <ul className="space-y-1 list-disc list-inside text-slate-300">
              <li><strong>Contour Interval:</strong> The vertical difference in elevation between adjacent contour lines. Smaller intervals (e.g. 10m) reveal micro-topography; larger intervals (50m, 100m) clarify steep alpine relief.</li>
              <li><strong>Index Contours:</strong> Every 5th contour line is drawn bolder with highlighted styling to expedite rapid visual elevation calculation.</li>
              <li><strong>Spacing & Slope:</strong> Closely spaced contours denote steep cliffs and precipitous ridges; widely separated contours indicate flat plains or gentle valley floors.</li>
            </ul>
          </div>

          {/* Section 3: Slope & Hillshade */}
          <div className="space-y-1.5 bg-[#182C42] p-3 rounded border border-[#233B54]">
            <h4 className="font-semibold text-amber-400 text-xs flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>3. Slope & Hillshade Algorithms</span>
            </h4>
            <p className="text-slate-300">
              Slope gradients are computed using Horn’s 3x3 finite-difference weighted gradient algorithm (standard in GDAL <code className="bg-[#122436] px-1 py-0.5 rounded text-amber-300">gdaldem slope</code> and ArcGIS).
            </p>
            <p className="text-slate-300">
              Hillshade simulates illumination from a light source at a specified solar azimuth (default 315° North-West) and solar altitude (default 45°). Vertical exaggeration increases visual relief perception without modifying underlying measurements.
            </p>
          </div>

          {/* Section 4: Geodesic vs Planar Calculations */}
          <div className="space-y-1.5 bg-[#182C42] p-3 rounded border border-[#233B54]">
            <h4 className="font-semibold text-purple-400 text-xs flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>4. Geodesic Calculations & CRS</span>
            </h4>
            <p className="text-slate-300">
              TerrainMap AI uses the WGS 84 ellipsoidal model (mean Earth radius 6,371,008.8 meters) with spherical excess geodesic area formulas. This prevents the severe high-latitude distortions caused by planar degree arithmetic.
            </p>
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
