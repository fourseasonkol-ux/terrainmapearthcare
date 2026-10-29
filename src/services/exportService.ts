import jsPDF from 'jspdf';
import { ProcessedTerrainData, ProfileAnalysisResult, PointElevationResult } from '../types/gis';

export interface ExportOptions {
  title: string;
  author?: string;
  notes?: string;
  includeLegend: boolean;
  includeScale: boolean;
  includeMetadata: boolean;
  format: 'png' | 'pdf' | 'geojson' | 'csv' | 'geotiff-meta';
}

/**
 * Downloads a text or binary file to user computer
 */
export function triggerDownload(content: Blob | string, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports GeoJSON vector features (contours, AOI, etc.)
 */
export function exportGeoJSON(data: GeoJSON.FeatureCollection, filename = 'terrain_contours.geojson') {
  const jsonStr = JSON.stringify(data, null, 2);
  triggerDownload(jsonStr, filename, 'application/geo+json');
}

/**
 * Exports CSV of profile or point elevation measurements
 */
export function exportProfileCSV(profile: ProfileAnalysisResult, filename = 'elevation_profile.csv') {
  const headers = ['Distance_Meters', 'Distance_Miles', 'Elevation_Meters', 'Elevation_Feet', 'Latitude', 'Longitude', 'Slope_Degrees'];
  const rows = profile.points.map(p => [
    p.distanceMeters,
    (p.distanceMeters * 0.000621371).toFixed(3),
    p.elevation.toFixed(1),
    (p.elevation * 3.28084).toFixed(1),
    p.latitude.toFixed(6),
    p.longitude.toFixed(6),
    p.slopeDegrees !== undefined ? p.slopeDegrees : ''
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  triggerDownload(csvContent, filename, 'text/csv');
}

/**
 * Exports CSV of sampled point inspection
 */
export function exportPointCSV(point: PointElevationResult, filename = 'point_elevation.csv') {
  const headers = ['Latitude', 'Longitude', 'Elevation_Meters', 'Elevation_Feet', 'Provider', 'Dataset', 'Datum', 'Resolution', 'Status'];
  const row = [
    point.latitude.toFixed(6),
    point.longitude.toFixed(6),
    point.elevation.toFixed(1),
    (point.elevation * 3.28084).toFixed(1),
    `"${point.provider}"`,
    `"${point.dataset}"`,
    `"${point.datum}"`,
    `"${point.resolution}"`,
    point.status
  ];
  const csvContent = [headers.join(','), row.join(',')].join('\n');
  triggerDownload(csvContent, filename, 'text/csv');
}

/**
 * Exports GeoTIFF geospatial metadata and GDAL command script
 */
export function exportGeoTIFFMetadata(terrain: ProcessedTerrainData, filename = 'terrain_geotiff_spec.txt') {
  const [w, s, e, n] = terrain.gridBbox;
  const content = `TerrainMap AI — Raster Terrain Specification
==================================================
Date of Export: ${new Date().toISOString()}
Software: TerrainMap AI (GDAL/Copernicus compliant)
CRS: EPSG:4326 (WGS 84 2D Geographic Coordinate System)
Vertical Datum: ${terrain.dataSource.datum}
Source Dataset: ${terrain.dataSource.dataset}
Provider: ${terrain.dataSource.provider}

GEOGRAPHIC BOUNDING BOX:
  West Longitude:  ${w.toFixed(6)}
  South Latitude:  ${s.toFixed(6)}
  East Longitude:  ${e.toFixed(6)}
  North Latitude:  ${n.toFixed(6)}

RASTER GRID DIMENSIONS:
  Columns: ${terrain.gridCols}
  Rows:    ${terrain.gridRows}
  Cell Resolution: ${terrain.dataSource.resolution}

ELEVATION SUMMARY:
  Minimum Elevation: ${terrain.statistics.minElevation} m (${(terrain.statistics.minElevation * 3.28084).toFixed(1)} ft)
  Maximum Elevation: ${terrain.statistics.maxElevation} m (${(terrain.statistics.maxElevation * 3.28084).toFixed(1)} ft)
  Elevation Relief:  ${terrain.statistics.elevationRange} m
  Mean Elevation:    ${terrain.statistics.meanElevation} m
  Standard Dev:      ${terrain.statistics.stdDevElevation} m
  Surface Area:      ${terrain.statistics.surfaceAreaKm2} km² (${terrain.statistics.surfaceAreaAcres} acres)

GDAL PIPELINE REPRODUCTION COMMAND:
  gdal_translate -of GTiff -a_ullr ${w} ${n} ${e} ${s} -a_srs EPSG:4326 input_dem.raw output_dem.tif
  gdaldem contour -a elev output_dem.tif contours.shp -i 20.0
  gdaldem slope output_dem.tif slope.tif -s 111120
  gdaldem hillshade output_dem.tif hillshade.tif -z 1.5 -az 315 -alt 45
`;
  triggerDownload(content, filename, 'text/plain');
}

/**
 * Generates a printable GIS PDF map sheet using jsPDF
 */
export async function exportGISMapPDF(
  mapCanvas: HTMLCanvasElement | null,
  options: ExportOptions,
  terrainData?: ProcessedTerrainData | null,
  profileData?: ProfileAnalysisResult | null
) {
  // Landscape A4: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;

  // Background
  doc.setFillColor(11, 23, 36); // #0B1724
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title header bar
  doc.setFillColor(18, 36, 54); // #122436
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 18, 2, 2, 'F');
  doc.setDrawColor(35, 59, 84);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 18, 2, 2, 'S');

  // Title text
  doc.setTextColor(86, 230, 178); // #56E6B2
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title || 'TerrainMap AI — Geospatial Terrain Product', margin + 6, margin + 8);

  // Subtitle / date
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  doc.text(`Generated: ${exportDate} | CRS: EPSG:4326 / WGS 84 | Author: ${options.author || 'GIS Surveyor'}`, margin + 6, margin + 14);

  // Map viewport area
  const mapWidth = 190;
  const mapHeight = 160;
  const mapX = margin;
  const mapY = margin + 22;

  doc.setFillColor(15, 23, 42);
  doc.rect(mapX, mapY, mapWidth, mapHeight, 'F');

  if (mapCanvas) {
    try {
      const imgData = mapCanvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', mapX, mapY, mapWidth, mapHeight);
    } catch (e) {
      console.warn('Could not add canvas image to PDF:', e);
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(10);
      doc.text('[Map Viewport Capture]', mapX + 20, mapY + 40);
    }
  }

  // Border around map
  doc.setDrawColor(86, 230, 178);
  doc.setLineWidth(0.6);
  doc.rect(mapX, mapY, mapWidth, mapHeight, 'S');

  // North arrow inside map (top right of map)
  const naX = mapX + mapWidth - 16;
  const naY = mapY + 16;
  doc.setFillColor(18, 36, 54);
  doc.circle(naX, naY, 8, 'F');
  doc.setDrawColor(86, 230, 178);
  doc.setLineWidth(0.5);
  doc.circle(naX, naY, 8, 'S');

  doc.setFillColor(86, 230, 178);
  doc.triangle(naX, naY - 6, naX - 3, naY + 2, naX, naY, 'F');
  doc.setFillColor(255, 255, 255);
  doc.triangle(naX, naY - 6, naX, naY, naX + 3, naY + 2, 'F');
  doc.setTextColor(86, 230, 178);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('N', naX - 1.5, naY - 7);

  // Right sidebar: Metadata & Legend Panel
  const panelX = mapX + mapWidth + 6;
  const panelWidth = pageWidth - margin - panelX;
  const panelY = mapY;
  const panelHeight = mapHeight;

  doc.setFillColor(18, 36, 54);
  doc.roundedRect(panelX, panelY, panelWidth, panelHeight, 2, 2, 'F');
  doc.setDrawColor(35, 59, 84);
  doc.roundedRect(panelX, panelY, panelWidth, panelHeight, 2, 2, 'S');

  let curY = panelY + 7;

  // Heading: Terrain Analytics
  doc.setTextColor(86, 230, 178);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TERRAIN METRICS', panelX + 5, curY);
  curY += 6;

  doc.setTextColor(241, 245, 249);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  if (terrainData) {
    const s = terrainData.statistics;
    doc.text(`Min Elevation:`, panelX + 5, curY);
    doc.text(`${s.minElevation} m (${(s.minElevation * 3.28084).toFixed(0)} ft)`, panelX + 45, curY);
    curY += 5;

    doc.text(`Max Elevation:`, panelX + 5, curY);
    doc.text(`${s.maxElevation} m (${(s.maxElevation * 3.28084).toFixed(0)} ft)`, panelX + 45, curY);
    curY += 5;

    doc.text(`Vertical Relief:`, panelX + 5, curY);
    doc.text(`${s.elevationRange} m`, panelX + 45, curY);
    curY += 5;

    doc.text(`Mean Elevation:`, panelX + 5, curY);
    doc.text(`${s.meanElevation} m`, panelX + 45, curY);
    curY += 5;

    doc.text(`Std Deviation:`, panelX + 5, curY);
    doc.text(`±${s.stdDevElevation} m`, panelX + 45, curY);
    curY += 5;

    doc.text(`Surface Area:`, panelX + 5, curY);
    doc.text(`${s.surfaceAreaKm2} km²`, panelX + 45, curY);
    curY += 7;

    if (s.slopeStats) {
      doc.setTextColor(86, 230, 178);
      doc.setFont('helvetica', 'bold');
      doc.text('SLOPE DISTRIBUTION', panelX + 5, curY);
      curY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(241, 245, 249);
      for (const dist of s.slopeStats.distribution) {
        doc.text(`${dist.range} (${dist.label}):`, panelX + 5, curY);
        doc.text(`${dist.percentage}%`, panelX + 62, curY);
        curY += 4.5;
      }
      curY += 3;
    }
  } else {
    doc.text('No raster area selected.', panelX + 5, curY);
    curY += 15;
  }

  // Heading: Map Legend
  doc.setTextColor(86, 230, 178);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MAP LEGEND', panelX + 5, curY);
  curY += 6;

  // Legend items
  // Index contour
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.8);
  doc.line(panelX + 5, curY - 1, panelX + 15, curY - 1);
  doc.setTextColor(241, 245, 249);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Index Contour (Bold)', panelX + 18, curY);
  curY += 5;

  // Intermediate contour
  doc.setDrawColor(86, 230, 178);
  doc.setLineWidth(0.4);
  doc.line(panelX + 5, curY - 1, panelX + 15, curY - 1);
  doc.text('Intermediate Contour', panelX + 18, curY);
  curY += 6;

  // Data Provenance & Limitations
  doc.setTextColor(86, 230, 178);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATA SOURCES & DATUM', panelX + 5, curY);
  curY += 5;

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Primary DEM: Copernicus GLO-30 DSM / USGS 3DEP', panelX + 5, curY);
  curY += 3.5;
  doc.text('Vertical Datum: EGM96 Geoid / NAVD88 Orthometric', panelX + 5, curY);
  curY += 3.5;
  doc.text('Basemap: OpenTopoMap & OpenStreetMap Contributors', panelX + 5, curY);
  curY += 3.5;
  doc.text('Disclaimer: Not certified for sole navigation. Verified geospatial', panelX + 5, curY);
  curY += 3;
  doc.text('measurements sourced from public scientific institutions.', panelX + 5, curY);

  doc.save(`${options.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'terrain_map'}.pdf`);
}
