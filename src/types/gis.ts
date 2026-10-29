export type ElevationUnit = 'meters' | 'feet';
export type SlopeUnit = 'degrees' | 'percent';

export type BasemapId =
  | 'streets'
  | 'satellite'
  | 'terrain'
  | 'hybrid'
  | 'topo'
  | 'light'
  | 'dark'
  | 'osm';

export interface ElevationProviderInfo {
  id: string;
  name: string;
  coverage: string;
  resolution: string;
  datum: string;
  type: 'DTM' | 'DSM' | 'Point Query API';
  description: string;
}

export interface PointElevationResult {
  latitude: number;
  longitude: number;
  elevation: number; // always stored in meters internally
  elevationFormatted: string;
  unit: ElevationUnit;
  provider: string;
  dataset: string;
  resolution: string;
  datum: string;
  retrievalTimeMs: number;
  status: 'OK' | 'UNAVAILABLE' | 'ERROR';
  notes?: string;
  rawResponse?: any;
}

export interface ProfilePoint {
  distanceMeters: number;
  elevation: number;
  latitude: number;
  longitude: number;
  slopeDegrees?: number;
}

export interface ProfileAnalysisResult {
  points: ProfilePoint[];
  totalDistanceMeters: number;
  minElevation: number;
  maxElevation: number;
  elevationGain: number;
  elevationLoss: number;
  averageSlope: number;
  maxSlope: number;
  sampleCount: number;
  provider: string;
  dataset: string;
  datum: string;
}

export interface TerrainStatistics {
  minElevation: number;
  maxElevation: number;
  elevationRange: number;
  meanElevation: number;
  stdDevElevation: number;
  validCellsCount: number;
  nodataCellsCount: number;
  surfaceAreaKm2: number;
  surfaceAreaAcres: number;
  slopeStats?: {
    meanSlopeDeg: number;
    maxSlopeDeg: number;
    distribution: {
      range: string;
      percentage: number;
      label: string;
    }[];
  };
  elevationHistogram: {
    binStart: number;
    binEnd: number;
    label: string;
    count: number;
  }[];
}

export interface ProcessingJob {
  id: string;
  status: 'idle' | 'queued' | 'running' | 'completed' | 'failed';
  operation: string;
  progressPercent?: number;
  startTime?: string;
  endTime?: string;
  sourceDataset: string;
  logs: string[];
  error?: string;
}

export interface ContourSettings {
  enabled: boolean;
  interval: number; // in current units
  unit: ElevationUnit;
  indexContourInterval: number; // e.g. every 5th
  lineColor: string;
  indexLineColor: string;
  lineWidth: number;
  showLabels: boolean;
}

export interface HillshadeSettings {
  enabled: boolean;
  azimuth: number; // 0 - 360 degrees
  altitude: number; // 0 - 90 degrees
  verticalExaggeration: number; // 1.0 - 5.0
  opacity: number;
}

export interface SlopeSettings {
  enabled: boolean;
  unit: SlopeUnit;
  colorRamp: 'inferno' | 'viridis' | 'spectral' | 'hazard';
  opacity: number;
}

export interface ElevationSettings {
  unit: ElevationUnit;
  colorRamp: 'terrain' | 'hypsometric' | 'earth' | 'grayscale';
  opacity: number;
  minDisplayMeters?: number;
  maxDisplayMeters?: number;
  autoStretch: boolean;
}

export interface AspectSettings {
  enabled: boolean;
  opacity: number;
}

export interface MapLayerState {
  elevationRelief: boolean;
  contours: boolean;
  slope: boolean;
  hillshade: boolean;
  aspect: boolean;
  userDrawings: boolean;
}

export interface AreaOfInterest {
  type: 'bbox' | 'polygon';
  bbox: [number, number, number, number]; // [west, south, east, north]
  coordinates?: [number, number][]; // polygon ring
  center: [number, number]; // [lng, lat]
  areaKm2?: number;
}

export interface SavedProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  center: [number, number];
  zoom: number;
  basemap: BasemapId;
  aoi?: AreaOfInterest;
  layers: MapLayerState;
  elevationSettings: ElevationSettings;
  contourSettings: ContourSettings;
  hillshadeSettings: HillshadeSettings;
  slopeSettings: SlopeSettings;
  activeDataSource: string;
}

export interface ProcessedTerrainData {
  jobId: string;
  aoi: AreaOfInterest;
  gridRows: number;
  gridCols: number;
  gridBbox: [number, number, number, number];
  statistics: TerrainStatistics;
  contoursGeoJson?: GeoJSON.FeatureCollection;
  dataSource: {
    provider: string;
    dataset: string;
    resolution: string;
    datum: string;
  };
  reliefImageDataUrl?: string;
  slopeImageDataUrl?: string;
  hillshadeImageDataUrl?: string;
  aspectImageDataUrl?: string;
}
