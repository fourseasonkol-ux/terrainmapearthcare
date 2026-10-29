import { PointElevationResult, ProfileAnalysisResult, ProcessedTerrainData, SavedProject } from '../types/gis';

export async function queryPointElevation(lat: number, lng: number): Promise<PointElevationResult> {
  const res = await fetch('/api/elevation/point', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `Elevation query failed (${res.status})`);
  }

  return res.json();
}

export async function sampleElevationProfile(
  coordinates: [number, number][],
  sampleCount = 60
): Promise<ProfileAnalysisResult> {
  const res = await fetch('/api/elevation/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates, sampleCount })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Profile query failed' }));
    throw new Error(errorData.error || `Profile query failed (${res.status})`);
  }

  return res.json();
}

export async function requestTerrainProcessing(params: {
  bbox: [number, number, number, number];
  resolutionGrid?: number;
  contourInterval?: number;
  indexContourMultiple?: number;
  hillshadeAzimuth?: number;
  hillshadeAltitude?: number;
  verticalExaggeration?: number;
}): Promise<ProcessedTerrainData> {
  const res = await fetch('/api/terrain/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Terrain processing failed' }));
    throw new Error(errorData.error || `Terrain processing failed (${res.status})`);
  }

  return res.json();
}

export interface GeocodeResultItem {
  displayName: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];
  type: string;
}

export async function searchGeocode(query: string): Promise<{ type: string; results: GeocodeResultItem[] }> {
  const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error('Geocoding search failed');
  }
  return res.json();
}

export async function getProjects(): Promise<SavedProject[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to load projects');
  return res.json();
}

export async function createOrUpdateProject(project: SavedProject): Promise<SavedProject> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  if (!res.ok) throw new Error('Failed to save project');
  return res.json();
}

export async function deleteProjectApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
  const data = await res.json();
  return data.success;
}

export async function queryGeminiAssistant(
  prompt: string,
  currentState: any
): Promise<{ reply: string; actions: { name: string; args: any }[] }> {
  const res = await fetch('/api/gemini/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, state: currentState })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Assistant error' }));
    throw new Error(errorData.error || 'Gemini assistant request failed');
  }

  return res.json();
}
