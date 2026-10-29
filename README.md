# TerrainMap AI — Professional Terrain Map Generator

A production-grade, full-stack geospatial web application built with **React**, **TypeScript**, **MapLibre GL JS**, **Express**, **Tailwind CSS**, and **Gemini 3.8 Flash**.

TerrainMap AI enables surveyors, civil engineers, alpine researchers, environmental planners, hikers, and GIS students to inspect verified real-world elevation, generate vector contour lines from Digital Elevation Models (DEMs), analyze Horn's slope gradients and hillshade, sample elevation profile cross-sections, and export cartographic products (PDF, PNG, GeoJSON, CSV, GeoTIFF).

---

## 🏔️ Core Capabilities

### 1. Zero-Fabrication Geospatial Architecture
* **Real Point Elevation Lookup**: Directly queries authoritative endpoints:
  * **USGS 3DEP**: National Map Elevation Point Query Service (EPQS) at 1/3 arc-second (~10m) resolution with NAVD88 orthometric datum for US territory.
  * **Copernicus DEM**: European Space Agency (ESA) GLO-30 Digital Surface Model (30m global resolution) with EGM96 geoid datum.
  * **Google Maps Platform Elevation API**: Optional high-resolution synthesized service when API key is configured.
* **No Invented Numbers**: If a coordinate is outside coverage or in deep bathymetry where DEM has nodata, the system explicitly reports `Elevation unavailable`.

### 2. Interactive Map Engine (MapLibre GL JS)
* **Multiple Basemaps**: OpenTopoMap, Satellite Orthophotography (Esri World Imagery), OpenStreetMap Standard, Terrain Relief, and Carto Dark Matter.
* **Real-Time Pointer Tracking**: Dynamic coordinate readout in Decimal Degrees and DMS (Degrees, Minutes, Seconds).
* **Drawing & Measurement Tools**:
  * Point Elevation Inspector
  * Area of Interest (AOI) Bounding Box
  * Elevation Profile Polyline
* **Vector Contour Layers**: Real vector lines rendered directly on the map with separate visual hierarchy for intermediate contours and index contours.

### 3. Raster Terrain Processing Engine
* **Vector Contours**: Generated using the marching-squares algorithm (`d3-contour`) directly on the elevation matrix, converted to valid WGS 84 GeoJSON features.
* **Horn's Slope Algorithm**: 3x3 weighted finite-difference gradient (identical to GDAL `gdaldem slope` and ESRI ArcGIS) in degrees (0°–90°) and percent grade (0%–>100%).
* **Horn's Hillshade**: Configurable solar azimuth (0°–360°), solar altitude (0°–90°), and vertical exaggeration.
* **Terrain Aspect**: Compass direction of slope face (0°–360°).
* **Hypsometric Curve & Statistics**: Min/max elevation, relief range, mean, standard deviation, valid/nodata cell count, and geodesic surface area in km² and acres.

### 4. Elevation Profile Cross-Section Analysis
* Plots cumulative distance against elevation using geodesic distance formulas (Haversine/Vincenty on WGS 84 ellipsoid).
* Interactive Recharts area chart with elevation gain (+), loss (-), average slope, and maximum grade.

### 5. Multi-Format GIS Export Suite
* **Printable PDF Map**: Landscape A4 layout with map viewport, North arrow, scale bar, legend, metadata, coordinate grid, and terrain metrics.
* **Lossless PNG**: High-resolution graphic capture of active map layers.
* **Vector GeoJSON**: Contour lines with elevation attributes, index flags, and line geometries.
* **Tabular CSV**: Sampled profile waypoints or point inspection records with coordinates and slope.
* **GeoTIFF Specification**: Georeferencing bounds, CRS, cell resolution, and GDAL command pipelines for QGIS / ArcGIS.

### 6. Gemini 3.8 Flash AI Assistant
* Interprets natural language GIS commands into validated tool calls:
  * `setContourInterval(intervalMeters, indexMultiple)`
  * `toggleLayer(layer, enabled)`
  * `configureHillshade(azimuth, altitude, exaggeration)`
  * `configureSlope(unit, colorRamp)`
  * `searchLocation(query)`
  * `setElevationUnits(unit)`
  * `runTerrainAnalysis(contourInterval)`
* Explains terrain geomorphology, drainage, and slope stability based strictly on verified dataset metrics.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, MapLibre GL JS, Tailwind CSS v4, Recharts, Lucide Icons, jsPDF
* **Backend**: Node.js, Express, tsx
* **Spatial & Mathematics**: Geodesic ellipsoidal formulas, d3-contour, Horn's terrain matrix
* **AI Model**: Google Gemini 3.8 Flash (`@google/genai` TypeScript SDK server-side)

---

## 🚀 Getting Started

### Prerequisites
* Node.js >= 18.0.0
* npm >= 9.0.0

### Environment Variables
Create a `.env` file or configure your secrets:
```bash
# Required for Gemini AI natural-language GIS assistant
GEMINI_API_KEY="your_gemini_api_key"

# Optional: Google Maps Platform Elevation API Key
GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# Server Port (default 3000)
PORT=3000
```

### Installation
```bash
# Install dependencies
npm install

# Run the full-stack development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
The application will be running at `http://localhost:3000`.

---

## 📜 Verified Data Sources & Datums

| Source | Coverage | Resolution | Model Type | Vertical Datum |
| :--- | :--- | :--- | :--- | :--- |
| **USGS 3DEP** | United States | 1/3 arc-second (~10m) | Digital Terrain Model (DTM) | NAVD88 Orthometric |
| **Copernicus DEM** | Global Landmasses | 1 arc-second (30m, GLO-30) | Digital Surface Model (DSM) | EGM96 Geoid |
| **Google Elevation** | Global Multi-Source | Variable (~10m–30m) | Synthesized Elevation | WGS 84 / EGM96 |
| **OpenTopoMap** | Global Basemap | N/A | Cartographic Topo Tiles | WGS 84 Web Mercator |
