/**
 * Geodesic and Geospatial calculation utilities
 * Avoids planar flat-earth distortions by using spherical/ellipsoidal geodesic formulas
 */

// Earth radius in meters (WGS 84 mean radius)
const EARTH_RADIUS_METERS = 6371008.8;

/**
 * Computes great-circle distance between two points in meters using Haversine formula
 */
export function calculateGeodesicDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates geodesic surface area of a polygon in square meters
 * Uses the spherical polygon area formula (Girard's theorem / segmented spherical excess)
 */
export function calculateGeodesicAreaSquareMeters(coords: [number, number][]): number {
  if (coords.length < 3) return 0;

  let totalAngle = 0;
  const len = coords.length;

  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const p3 = coords[(i + 2) % len];

    const b1 = bearingRadians(p2[1], p2[0], p1[1], p1[0]);
    const b2 = bearingRadians(p2[1], p2[0], p3[1], p3[0]);

    let angle = b2 - b1;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    while (angle > Math.PI) angle -= 2 * Math.PI;

    totalAngle += angle;
  }

  // Fallback to trapezoid geodesic if polygon winding has issues
  let area = 0;
  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const p1LatRad = (p1[1] * Math.PI) / 180;
    const p2LatRad = (p2[1] * Math.PI) / 180;
    const dLonRad = ((p2[0] - p1[0]) * Math.PI) / 180;
    area += dLonRad * (2 + Math.sin(p1LatRad) + Math.sin(p2LatRad));
  }
  area = (Math.abs(area) * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 4;
  return area;
}

function bearingRadians(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return Math.atan2(y, x);
}

/**
 * Validates latitude and longitude ranges strictly
 */
export function validateCoordinates(lat: number, lon: number): { valid: boolean; error?: string } {
  if (isNaN(lat) || isNaN(lon)) {
    return { valid: false, error: 'Coordinates must be valid numbers' };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: `Latitude ${lat} is out of range (-90 to 90)` };
  }
  if (lon < -180 || lon > 180) {
    return { valid: false, error: `Longitude ${lon} is out of range (-180 to 180)` };
  }
  return { valid: true };
}

/**
 * Converts Decimal Degrees to DMS string (e.g. 45° 20' 15.2" N)
 */
export function formatDMS(dec: number, isLatitude: boolean): string {
  const direction = isLatitude ? (dec >= 0 ? 'N' : 'S') : (dec >= 0 ? 'E' : 'W');
  const absVal = Math.abs(dec);
  const degrees = Math.floor(absVal);
  const minutesDec = (absVal - degrees) * 60;
  const minutes = Math.floor(minutesDec);
  const seconds = ((minutesDec - minutes) * 60).toFixed(1);

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

/**
/**
 * Ultra-robust coordinate parser supporting:
 * - Decimal: "46.8523, -121.7603" or "46.8523 -121.7603" or "-121.7603, 46.8523"
 * - Direction letters: "46.8523 N, 121.7603 W" or "46.8523N, 121.7603W" or "121.7603W, 46.8523N"
 * - Labels: "lat: 46.8523, lng: -121.7603", "latitude: 46.8523, longitude: -121.7603"
 * - Brackets: "[46.8523, -121.7603]", "(46.8523, -121.7603)"
 * - DMS: "46° 51' 08\" N, 121° 45' 37\" W" or "46°51'8\"N 121°45'37\"W"
 * - DDM (Degrees Decimal Minutes): "46° 51.133' N, 121° 45.617' W"
 */
export function parseCoordinateString(input: string): { lat: number; lng: number } | null {
  if (!input) return null;
  let clean = input.trim();
  if (!clean) return null;

  // Remove surrounding brackets or quotes
  clean = clean.replace(/^[\[\(\{<"]+|[\]\)\}>"]+$/g, '').trim();

  // 1. Check for labeled format: lat: 46.85, lon/lng: -121.76 or latitude: ..., longitude: ...
  const labeledLatMatch = clean.match(/(?:lat|latitude|y)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*([NS])?/i);
  const labeledLngMatch = clean.match(/(?:lon|long|lng|longitude|x)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*([EW])?/i);

  if (labeledLatMatch && labeledLngMatch) {
    let lat = parseFloat(labeledLatMatch[1]);
    let lng = parseFloat(labeledLngMatch[1]);
    if (labeledLatMatch[2]?.toUpperCase() === 'S') lat = -Math.abs(lat);
    if (labeledLngMatch[2]?.toUpperCase() === 'W') lng = -Math.abs(lng);

    if (validateCoordinates(lat, lng).valid) {
      return { lat, lng };
    }
  }

  // 2. Check for DMS: e.g. 46° 51' 08.5" N, 121° 45' 37.2" W or 46 51 08 N 121 45 37 W
  const dmsRegex = /(\d+(?:\.\d+)?)[°\s]+(?:(\d+(?:\.\d+)?)['\s]+)?(?:(\d+(?:\.\d+)?)["\s]*)?([NSEW])/gi;
  const dmsMatches = [...clean.matchAll(dmsRegex)];

  if (dmsMatches.length === 2) {
    let lat: number | null = null;
    let lng: number | null = null;

    for (const match of dmsMatches) {
      const deg = parseFloat(match[1]);
      const min = match[2] ? parseFloat(match[2]) : 0;
      const sec = match[3] ? parseFloat(match[3]) : 0;
      const dir = match[4].toUpperCase();

      let val = deg + min / 60 + sec / 3600;
      if (dir === 'S' || dir === 'W') val = -val;

      if (dir === 'N' || dir === 'S') lat = val;
      else if (dir === 'E' || dir === 'W') lng = val;
    }

    if (lat !== null && lng !== null && validateCoordinates(lat, lng).valid) {
      return { lat, lng };
    }
  }

  // 3. Check for decimal coordinates with direction letters: e.g. "46.8523 N, 121.7603 W" or "121.7603W 46.8523N"
  const decWithDirRegex = /([+-]?\d+(?:\.\d+)?)\s*[°]?\s*([NSEW])/gi;
  const decDirMatches = [...clean.matchAll(decWithDirRegex)];
  if (decDirMatches.length === 2) {
    let lat: number | null = null;
    let lng: number | null = null;

    for (const match of decDirMatches) {
      const num = parseFloat(match[1]);
      const dir = match[2].toUpperCase();
      const val = (dir === 'S' || dir === 'W') ? -Math.abs(num) : Math.abs(num);

      if (dir === 'N' || dir === 'S') lat = val;
      else if (dir === 'E' || dir === 'W') lng = val;
    }

    if (lat !== null && lng !== null && validateCoordinates(lat, lng).valid) {
      return { lat, lng };
    }
  }

  // 4. Pure numeric pair: "46.8523, -121.7603" or "46.8523 -121.7603" or "46.8523; -121.7603"
  const numericPairRegex = /([+-]?\d+(?:\.\d+)?)[,\s;/]+([+-]?\d+(?:\.\d+)?)/;
  const numMatch = clean.match(numericPairRegex);
  if (numMatch) {
    const val1 = parseFloat(numMatch[1]);
    const val2 = parseFloat(numMatch[2]);

    // Check normal lat, lng order
    if (validateCoordinates(val1, val2).valid) {
      // If val1 is clearly outside latitude bounds (> 90 or < -90) but val2 is within (-90 to 90),
      // the user likely entered [lng, lat]
      if (Math.abs(val1) > 90 && Math.abs(val2) <= 90) {
        return { lat: val2, lng: val1 };
      }
      return { lat: val1, lng: val2 };
    }

    // Try reversed [lng, lat] order if val2 is within latitude range
    if (validateCoordinates(val2, val1).valid) {
      return { lat: val2, lng: val1 };
    }
  }

  return null;
}

export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

export function feetToMeters(feet: number): number {
  return feet / 3.28084;
}

export function sqMetersToKm2(sqMeters: number): number {
  return sqMeters / 1_000_000;
}

export function sqMetersToAcres(sqMeters: number): number {
  return sqMeters * 0.000247105;
}
