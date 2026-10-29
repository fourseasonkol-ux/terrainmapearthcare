import fs from 'fs';
import path from 'path';
import { SavedProject } from '../src/types/gis';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

const INITIAL_PROJECTS: SavedProject[] = [
  {
    id: 'proj_rainier',
    name: 'Mount Rainier Volcano & Glaciers',
    description: 'Cascade Range stratovolcano study area with prominent volcanic relief and glaciers (4,392 m summit).',
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date('2026-01-15').toISOString(),
    center: [-121.7603, 46.8523],
    zoom: 12,
    basemap: 'topo',
    aoi: {
      type: 'bbox',
      bbox: [-121.84, 46.80, -121.68, 46.90],
      center: [-121.76, 46.85],
      areaKm2: 138.4
    },
    layers: {
      elevationRelief: true,
      contours: true,
      slope: false,
      hillshade: true,
      aspect: false,
      userDrawings: true
    },
    elevationSettings: {
      unit: 'meters',
      colorRamp: 'hypsometric',
      opacity: 0.8,
      autoStretch: true
    },
    contourSettings: {
      enabled: true,
      interval: 50,
      unit: 'meters',
      indexContourInterval: 5,
      lineColor: '#56E6B2',
      indexLineColor: '#38BDF8',
      lineWidth: 1.2,
      showLabels: true
    },
    hillshadeSettings: {
      enabled: true,
      azimuth: 315,
      altitude: 45,
      verticalExaggeration: 1.5,
      opacity: 0.7
    },
    slopeSettings: {
      enabled: false,
      unit: 'degrees',
      colorRamp: 'inferno',
      opacity: 0.75
    },
    activeDataSource: 'USGS 3DEP & Copernicus GLO-30'
  },
  {
    id: 'proj_grand_canyon',
    name: 'Grand Canyon South Rim',
    description: 'Colorado Plateau canyon geomorphology with extreme vertical relief (2,150 m to 740 m).',
    createdAt: new Date('2026-02-10').toISOString(),
    updatedAt: new Date('2026-02-10').toISOString(),
    center: [-112.1401, 36.0544],
    zoom: 13,
    basemap: 'terrain',
    aoi: {
      type: 'bbox',
      bbox: [-112.20, 36.02, -112.08, 36.09],
      center: [-112.14, 36.055],
      areaKm2: 82.6
    },
    layers: {
      elevationRelief: true,
      contours: true,
      slope: true,
      hillshade: true,
      aspect: false,
      userDrawings: true
    },
    elevationSettings: {
      unit: 'meters',
      colorRamp: 'terrain',
      opacity: 0.8,
      autoStretch: true
    },
    contourSettings: {
      enabled: true,
      interval: 40,
      unit: 'meters',
      indexContourInterval: 5,
      lineColor: '#F59E0B',
      indexLineColor: '#EF4444',
      lineWidth: 1.2,
      showLabels: true
    },
    hillshadeSettings: {
      enabled: true,
      azimuth: 315,
      altitude: 45,
      verticalExaggeration: 1.8,
      opacity: 0.65
    },
    slopeSettings: {
      enabled: true,
      unit: 'degrees',
      colorRamp: 'hazard',
      opacity: 0.7
    },
    activeDataSource: 'USGS 3DEP 1/3 arc-second'
  },
  {
    id: 'proj_matterhorn',
    name: 'Matterhorn / Cervino Horn Peak',
    description: 'Pyramidal peak in the Pennine Alps on the Swiss-Italian border (4,478 m).',
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date('2026-03-01').toISOString(),
    center: [7.6586, 45.9765],
    zoom: 13,
    basemap: 'satellite',
    aoi: {
      type: 'bbox',
      bbox: [7.60, 45.94, 7.72, 46.01],
      center: [7.66, 45.975],
      areaKm2: 68.3
    },
    layers: {
      elevationRelief: true,
      contours: true,
      slope: false,
      hillshade: true,
      aspect: false,
      userDrawings: true
    },
    elevationSettings: {
      unit: 'meters',
      colorRamp: 'earth',
      opacity: 0.7,
      autoStretch: true
    },
    contourSettings: {
      enabled: true,
      interval: 50,
      unit: 'meters',
      indexContourInterval: 5,
      lineColor: '#56E6B2',
      indexLineColor: '#38BDF8',
      lineWidth: 1.3,
      showLabels: true
    },
    hillshadeSettings: {
      enabled: true,
      azimuth: 315,
      altitude: 50,
      verticalExaggeration: 1.4,
      opacity: 0.7
    },
    slopeSettings: {
      enabled: false,
      unit: 'degrees',
      colorRamp: 'inferno',
      opacity: 0.7
    },
    activeDataSource: 'Copernicus GLO-30 DSM'
  }
];

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(INITIAL_PROJECTS, null, 2), 'utf-8');
  }
}

export function getAllProjects(): SavedProject[] {
  try {
    ensureDataFile();
    const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed reading projects file, returning initial projects:', err);
    return INITIAL_PROJECTS;
  }
}

export function saveProject(project: SavedProject): SavedProject {
  ensureDataFile();
  const projects = getAllProjects();
  const existingIdx = projects.findIndex(p => p.id === project.id);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    projects[existingIdx] = {
      ...project,
      updatedAt: now
    };
  } else {
    projects.unshift({
      ...project,
      createdAt: now,
      updatedAt: now
    });
  }

  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  return project;
}

export function deleteProject(id: string): boolean {
  ensureDataFile();
  const projects = getAllProjects();
  const filtered = projects.filter(p => p.id !== id);
  if (filtered.length !== projects.length) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
  return false;
}
