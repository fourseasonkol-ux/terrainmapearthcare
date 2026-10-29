import React, { useState } from 'react';
import { X, Navigation, CheckCircle2, AlertCircle, Copy, Compass, MapPin } from 'lucide-react';
import { GeocodeResultItem } from '../services/api';
import { validateCoordinates, parseCoordinateString, formatDMS } from '../services/geoUtils';

interface CoordinateInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCoordinates: (result: GeocodeResultItem) => void;
  initialLat?: number;
  initialLng?: number;
}

export const CoordinateInputModal: React.FC<CoordinateInputModalProps> = ({
  isOpen,
  onClose,
  onNavigateToCoordinates,
  initialLat,
  initialLng
}) => {
  const [mode, setMode] = useState<'decimal' | 'dms' | 'paste'>('decimal');

  // Decimal state
  const [decLat, setDecLat] = useState(initialLat !== undefined ? initialLat.toFixed(5) : '');
  const [decLng, setDecLng] = useState(initialLng !== undefined ? initialLng.toFixed(5) : '');

  // DMS state
  const [latDeg, setLatDeg] = useState('');
  const [latMin, setLatMin] = useState('');
  const [latSec, setLatSec] = useState('');
  const [latDir, setLatDir] = useState<'N' | 'S'>('N');

  const [lngDeg, setLngDeg] = useState('');
  const [lngMin, setLngMin] = useState('');
  const [lngSec, setLngSec] = useState('');
  const [lngDir, setLngDir] = useState<'E' | 'W'>('W');

  // Paste state
  const [pasteInput, setPasteInput] = useState('');

  // Error/validation feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyDecimal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const lat = parseFloat(decLat.trim());
    const lng = parseFloat(decLng.trim());

    const validation = validateCoordinates(lat, lng);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please enter valid numerical coordinates.');
      return;
    }

    onNavigateToCoordinates({
      displayName: `Coordinates: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
      lat,
      lng,
      bbox: [lng - 0.05, lat - 0.05, lng + 0.05, lat + 0.05],
      type: 'coordinate_lookup'
    });
    onClose();
  };

  const handleApplyDMS = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const lD = parseFloat(latDeg) || 0;
    const lM = parseFloat(latMin) || 0;
    const lS = parseFloat(latSec) || 0;

    const gD = parseFloat(lngDeg) || 0;
    const gM = parseFloat(lngMin) || 0;
    const gS = parseFloat(lngSec) || 0;

    let lat = lD + lM / 60 + lS / 3600;
    if (latDir === 'S') lat = -lat;

    let lng = gD + gM / 60 + gS / 3600;
    if (lngDir === 'W') lng = -lng;

    const validation = validateCoordinates(lat, lng);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please enter valid DMS degree values.');
      return;
    }

    onNavigateToCoordinates({
      displayName: `Coordinates: ${lat.toFixed(5)}°, ${lng.toFixed(5)}° (${formatDMS(lat, true)} ${formatDMS(lng, false)})`,
      lat,
      lng,
      bbox: [lng - 0.05, lat - 0.05, lng + 0.05, lat + 0.05],
      type: 'coordinate_lookup'
    });
    onClose();
  };

  const handleApplyPaste = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = parseCoordinateString(pasteInput);
    if (!parsed) {
      setErrorMsg('Could not parse coordinates. Please verify format (e.g. "46.8523, -121.7603" or "46°51\'08\\"N 121°45\'37\\"W").');
      return;
    }

    onNavigateToCoordinates({
      displayName: `Coordinates: ${parsed.lat.toFixed(5)}°, ${parsed.lng.toFixed(5)}°`,
      lat: parsed.lat,
      lng: parsed.lng,
      bbox: [parsed.lng - 0.05, parsed.lat - 0.05, parsed.lng + 0.05, parsed.lat + 0.05],
      type: 'coordinate_lookup'
    });
    onClose();
  };

  const presets = [
    { name: 'Mount Rainier, WA', lat: 46.8523, lng: -121.7603 },
    { name: 'Grand Canyon, AZ', lat: 36.0544, lng: -112.1401 },
    { name: 'Matterhorn, Alps', lat: 45.9765, lng: 7.6586 },
    { name: 'Mount Fuji, Japan', lat: 35.3606, lng: 138.7274 },
    { name: 'Mount Everest, Himalayas', lat: 27.9881, lng: 86.9250 }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#122436] border border-[#233B54] rounded-lg max-w-md w-full shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#233B54] flex items-center justify-between bg-[#0B1724]">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#56E6B2]" />
            <h3 className="font-semibold text-slate-100 text-sm">Go to Geographic Coordinates</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex border-b border-[#233B54] bg-[#0E1C2B] p-1.5 space-x-1">
          <button
            onClick={() => { setMode('decimal'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
              mode === 'decimal'
                ? 'bg-[#182C42] text-[#56E6B2] border border-[#233B54]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Decimal Degrees (DD)
          </button>
          <button
            onClick={() => { setMode('dms'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
              mode === 'dms'
                ? 'bg-[#182C42] text-[#56E6B2] border border-[#233B54]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DMS (Deg Min Sec)
          </button>
          <button
            onClick={() => { setMode('paste'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
              mode === 'paste'
                ? 'bg-[#182C42] text-[#56E6B2] border border-[#233B54]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Any Format
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode 1: Decimal Degrees */}
          {mode === 'decimal' && (
            <form onSubmit={handleApplyDecimal} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Latitude (–90° to +90°)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 46.8523"
                    value={decLat}
                    onChange={(e) => setDecLat(e.target.value)}
                    className="w-full bg-[#182C42] border border-[#233B54] rounded px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#56E6B2]"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono">°N/S</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Positive for North, negative for South</p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Longitude (–180° to +180°)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. -121.7603"
                    value={decLng}
                    onChange={(e) => setDecLng(e.target.value)}
                    className="w-full bg-[#182C42] border border-[#233B54] rounded px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#56E6B2]"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono">°E/W</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Positive for East, negative for West</p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 bg-[#182C42] hover:bg-[#203a57] rounded text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#56E6B2] hover:bg-[#45d4a1] text-[#0B1724] font-semibold rounded flex items-center space-x-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Go to Coordinates</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: Degrees Minutes Seconds (DMS) */}
          {mode === 'dms' && (
            <form onSubmit={handleApplyDMS} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Latitude (DMS)</label>
                <div className="grid grid-cols-4 gap-1.5 items-center">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    placeholder="Deg"
                    value={latDeg}
                    onChange={(e) => setLatDeg(e.target.value)}
                    className="bg-[#182C42] border border-[#233B54] rounded p-2 text-center text-xs font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Min"
                    value={latMin}
                    onChange={(e) => setLatMin(e.target.value)}
                    className="bg-[#182C42] border border-[#233B54] rounded p-2 text-center text-xs font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59.99"
                    step="any"
                    placeholder="Sec"
                    value={latSec}
                    onChange={(e) => setLatSec(e.target.value)}
                    className="bg-[#182C42] border border-[#233B54] rounded p-2 text-center text-xs font-mono"
                  />
                  <select
                    value={latDir}
                    onChange={(e) => setLatDir(e.target.value as any)}
                    className="bg-[#182C42] border border-[#233B54] rounded p-2 text-xs font-semibold text-[#56E6B2]"
                  >
                    <option value="N">N (North)</option>
                    <option value="S">S (South)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Longitude (DMS)</label>
                <div className="grid grid-cols-4 gap-1.5 items-center">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    placeholder="Deg"
                    value={lngDeg}
                    onChange={(e) => setLngDeg(e.target.value)}
                    className="bg-[#182C42] border border-[#233B54] rounded p-2 text-center text-xs font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Min"
                    value={lngMin}
                    onChange={(e) => setLngMin(e.target.value)}
                    className="bg-[#182C42] border border-[#233B54] rounded p-2 text-center text-xs font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59.99"
                    step="any"
                    placeholder="Sec"
                    value={lngSec}
                    onChange={(e) => setLngSec(e.target.value)}
                    className="bg-[#182C42] border border-[#233B54] rounded p-2 text-center text-xs font-mono"
                  />
                  <select
                    value={lngDir}
                    onChange={(e) => setLngDir(e.target.value as any)}
                    className="bg-[#182C42] border border-[#233B54] rounded p-2 text-xs font-semibold text-[#56E6B2]"
                  >
                    <option value="W">W (West)</option>
                    <option value="E">E (East)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 bg-[#182C42] hover:bg-[#203a57] rounded text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#56E6B2] hover:bg-[#45d4a1] text-[#0B1724] font-semibold rounded flex items-center space-x-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Go to Coordinates</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 3: Paste Any Format */}
          {mode === 'paste' && (
            <form onSubmit={handleApplyPaste} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Paste Coordinates String
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Paste e.g.:
46.8523, -121.7603
46° 51' 08&quot; N, 121° 45' 37&quot; W
lat: 46.8523, lng: -121.7603"
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  className="w-full bg-[#182C42] border border-[#233B54] rounded p-2.5 font-mono text-xs text-slate-100 focus:outline-none focus:border-[#56E6B2]"
                />
              </div>

              {pasteInput.trim() && (() => {
                const preview = parseCoordinateString(pasteInput);
                return (
                  <div className={`p-2 rounded font-mono text-[11px] ${preview ? 'bg-[#0E1C2B] text-[#56E6B2] border border-[#56E6B2]/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'}`}>
                    {preview
                      ? `Detected: Lat ${preview.lat.toFixed(5)}°, Lng ${preview.lng.toFixed(5)}°`
                      : 'Unrecognized format or out of bounds (-90 to 90, -180 to 180)'}
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 bg-[#182C42] hover:bg-[#203a57] rounded text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#56E6B2] hover:bg-[#45d4a1] text-[#0B1724] font-semibold rounded flex items-center space-x-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Go to Coordinates</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick Preset Coordinates */}
          <div className="pt-2 border-t border-[#233B54]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Geographic Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDecLat(p.lat.toString());
                    setDecLng(p.lng.toString());
                    setMode('decimal');
                  }}
                  className="text-[10px] bg-[#182C42] hover:bg-[#1F3D5C] text-slate-300 hover:text-[#56E6B2] border border-[#233B54] px-2 py-1 rounded font-mono transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
