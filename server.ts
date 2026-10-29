import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchPointElevation, sampleElevationProfile } from './server/elevationService';
import { processTerrainAOI } from './server/terrainRasterEngine';
import { processGeminiGISPrompt } from './server/geminiService';
import { getAllProjects, saveProject, deleteProject } from './server/projectStorage';
import { parseCoordinateString, validateCoordinates } from './src/services/geoUtils';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.resolve(__dirname, 'public')));

// Explicitly serve MapLibre Web Worker to prevent Vite / Cloud Run iframe blob worker errors
app.get('/maplibre-gl-worker.mjs', (req, res) => {
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  const pubFile = path.resolve(__dirname, 'public/maplibre-gl-worker.mjs');
  if (fs.existsSync(pubFile)) {
    return res.sendFile(pubFile);
  }
  const nmFile = path.resolve(__dirname, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
  return res.sendFile(nmFile);
});

// Explicitly serve logo.png and favicon.png
app.get(['/logo.png', '/favicon.png'], (req, res) => {
  const logoPath = path.resolve(__dirname, 'public/logo.png');
  if (fs.existsSync(logoPath)) {
    res.setHeader('Content-Type', 'image/png');
    return res.sendFile(logoPath);
  }
  res.status(404).end();
});

// 1. Health check & configuration metadata
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    elevationProviders: {
      usgs3dep: 'Available (US coverage: EPQS 1/3 arc-second)',
      copernicusDEM: 'Available (Global coverage: GLO-30 DSM)',
      googleElevation: process.env.GOOGLE_MAPS_API_KEY ? 'Configured' : 'Not configured (using open authoritative sources)'
    },
    geminiAi: process.env.GEMINI_API_KEY ? 'Configured' : 'Missing key'
  });
});

// 2. Point Elevation Query
app.post('/api/elevation/point', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng parameters are required' });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    const validation = validateCoordinates(latitude, longitude);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await fetchPointElevation(latitude, longitude);
    res.json(result);
  } catch (err: any) {
    console.error('Point elevation error:', err);
    res.status(500).json({ error: err.message || 'Failed to query elevation' });
  }
});

// 3. Elevation Profile Sampling along a drawn polyline
app.post('/api/elevation/profile', async (req, res) => {
  try {
    const { coordinates, sampleCount } = req.body;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({ error: 'Array of at least 2 [lng, lat] coordinates required' });
    }

    const result = await sampleElevationProfile(coordinates, sampleCount || 60);
    res.json(result);
  } catch (err: any) {
    console.error('Elevation profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to sample elevation profile' });
  }
});

// 4. Raster Terrain Processing Engine (AOI BBox -> Contours, Horn's Slope, Hillshade, Aspect, Stats)
app.post('/api/terrain/process', async (req, res) => {
  try {
    const { bbox, resolutionGrid, contourInterval, indexContourMultiple, hillshadeAzimuth, hillshadeAltitude, verticalExaggeration } = req.body;

    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return res.status(400).json({ error: 'bbox array [west, south, east, north] is required' });
    }

    const result = await processTerrainAOI({
      bbox: [Number(bbox[0]), Number(bbox[1]), Number(bbox[2]), Number(bbox[3])],
      resolutionGrid: resolutionGrid ? Number(resolutionGrid) : 26,
      contourInterval: contourInterval ? Number(contourInterval) : undefined,
      indexContourMultiple: indexContourMultiple ? Number(indexContourMultiple) : 5,
      hillshadeAzimuth: hillshadeAzimuth ? Number(hillshadeAzimuth) : 315,
      hillshadeAltitude: hillshadeAltitude ? Number(hillshadeAltitude) : 45,
      verticalExaggeration: verticalExaggeration ? Number(verticalExaggeration) : 1.5
    });

    res.json(result);
  } catch (err: any) {
    console.error('Terrain processing error:', err);
    res.status(500).json({ error: err.message || 'Failed to process terrain data' });
  }
});

// 5. Geocoding & Coordinate Location Search
app.get('/api/geocode/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query string required' });
    }

    // Check if user entered coordinates (Decimal or DMS)
    const parsedCoords = parseCoordinateString(query);
    if (parsedCoords) {
      return res.json({
        type: 'coordinates',
        results: [
          {
            displayName: `Coordinates: ${parsedCoords.lat.toFixed(5)}, ${parsedCoords.lng.toFixed(5)}`,
            lat: parsedCoords.lat,
            lng: parsedCoords.lng,
            bbox: [
              parsedCoords.lng - 0.05,
              parsedCoords.lat - 0.05,
              parsedCoords.lng + 0.05,
              parsedCoords.lat + 0.05
            ],
            type: 'coordinate_lookup'
          }
        ]
      });
    }

    // Forward to OpenStreetMap Nominatim geocoder
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const geoRes = await fetch(url, {
      headers: {
        'User-Agent': 'TerrainMapAI/1.0 (GIS educational platform)'
      }
    });

    if (!geoRes.ok) {
      return res.json({ type: 'places', results: [] });
    }

    const data = await geoRes.json();
    const results = (data || []).map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      bbox: item.boundingbox
        ? [parseFloat(item.boundingbox[2]), parseFloat(item.boundingbox[0]), parseFloat(item.boundingbox[3]), parseFloat(item.boundingbox[1])]
        : [parseFloat(item.lon) - 0.05, parseFloat(item.lat) - 0.05, parseFloat(item.lon) + 0.05, parseFloat(item.lat) + 0.05],
      type: item.type || item.class
    }));

    res.json({ type: 'places', results });
  } catch (err: any) {
    console.error('Geocoding search error:', err);
    res.status(500).json({ error: err.message || 'Geocoding service unavailable' });
  }
});

// 6. Persistent Saved Projects
app.get('/api/projects', (req, res) => {
  try {
    const projects = getAllProjects();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const project = req.body;
    if (!project || !project.name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    const saved = saveProject(project);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteProject(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Gemini AI GIS Assistant Endpoint
app.post('/api/gemini/assistant', async (req, res) => {
  try {
    const { prompt, state } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await processGeminiGISPrompt(prompt, state || {
      center: [-121.76, 46.85],
      zoom: 12,
      activeBasemap: 'topo',
      layers: {},
      elevationUnit: 'meters',
      contourInterval: 50
    });

    res.json(result);
  } catch (err: any) {
    console.error('Gemini assistant error:', err);
    res.status(500).json({ error: err.message || 'Gemini assistant error' });
  }
});

// Start server with Vite middleware in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TerrainMap AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
