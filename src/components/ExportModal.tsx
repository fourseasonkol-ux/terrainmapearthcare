import React, { useState } from 'react';
import { X, Download, FileText, Image, MapPin, CheckCircle2 } from 'lucide-react';
import { ProcessedTerrainData, ProfileAnalysisResult, PointElevationResult } from '../types/gis';
import {
  exportGeoJSON,
  exportProfileCSV,
  exportGeoTIFFMetadata,
  exportGISMapPDF,
  triggerDownload
} from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrainData: ProcessedTerrainData | null;
  profileResult: ProfileAnalysisResult | null;
  inspectedPoint: PointElevationResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  terrainData,
  profileResult
}) => {
  const [exportTitle, setExportTitle] = useState('Terrain Study Map');
  const [authorName, setAuthorName] = useState('Cartographer');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      const mapCanvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement | null;
      await exportGISMapPDF(
        mapCanvas,
        {
          title: exportTitle,
          author: authorName,
          includeLegend: true,
          includeScale: true,
          includeMetadata: true,
          format: 'pdf'
        },
        terrainData,
        profileResult
      );
      setExportSuccessMsg('PDF map exported successfully.');
    } catch (err: any) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = () => {
    setIsExporting(true);
    try {
      const mapCanvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement | null;
      if (!mapCanvas) {
        throw new Error('Map canvas not found');
      }

      mapCanvas.toBlob((blob) => {
        if (blob) {
          triggerDownload(blob, `${exportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`, 'image/png');
          setExportSuccessMsg('High-resolution PNG map saved.');
        }
        setIsExporting(false);
      });
    } catch (err: any) {
      console.error('PNG export error:', err);
      setIsExporting(false);
    }
  };

  const handleExportGeoJSON = () => {
    if (terrainData?.contoursGeoJson) {
      exportGeoJSON(terrainData.contoursGeoJson, `${exportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_contours.geojson`);
      setExportSuccessMsg('Contour lines exported as GeoJSON.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-xs text-gray-700">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Export Map</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {exportSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] text-gray-600 mb-1 font-medium">Map Title</label>
            <input
              type="text"
              value={exportTitle}
              onChange={(e) => setExportTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Export Options */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Choose Format
            </span>

            {/* PNG Image */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-center justify-between hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Image className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-xs">Image (PNG)</h4>
                  <p className="text-[11px] text-gray-500">
                    High-resolution image of current map view
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs shrink-0 transition-colors cursor-pointer"
              >
                Download
              </button>
            </div>

            {/* PDF Layout */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-center justify-between hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-xs">Printable Document (PDF)</h4>
                  <p className="text-[11px] text-gray-500">
                    Clean printable sheet with map, title, scale & north arrow
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-xs shrink-0 transition-colors cursor-pointer"
              >
                Generate
              </button>
            </div>

            {/* GeoJSON */}
            {terrainData?.contoursGeoJson && (
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-center justify-between hover:border-emerald-300 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-xs">Contour Vectors (GeoJSON)</h4>
                    <p className="text-[11px] text-gray-500">
                      Standard GIS vector contours
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportGeoJSON}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs shrink-0 transition-colors cursor-pointer"
                >
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
