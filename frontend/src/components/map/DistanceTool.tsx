import { useState } from 'react';
import { Ruler, X } from 'lucide-react';
import client from '../../api/client';
import type { MapPin } from '../../types';

interface DistanceToolProps {
  pins: MapPin[];
}

export default function DistanceTool({ pins }: DistanceToolProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState<{ distance_km: number; distance_miles: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = async () => {
    const pinA = pins.find((p) => p.id === from);
    const pinB = pins.find((p) => p.id === to);
    if (!pinA || !pinB) return;
    setLoading(true);
    const res = await client.post('/map/distance', {
      lat1: pinA.latitude, lon1: pinA.longitude,
      lat2: pinB.latitude, lon2: pinB.longitude,
    });
    setResult(res.data);
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-8 right-4 z-[900] flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl shadow-lg hover:bg-slate-50 transition-colors"
      >
        <Ruler size={16} className="text-blue-600" />
        Distance Tool
      </button>
    );
  }

  return (
    <div className="absolute bottom-8 right-4 z-[900] bg-white rounded-2xl shadow-2xl border border-slate-100 w-72 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Ruler size={15} className="text-blue-600" />
          Distance Tool
        </div>
        <button onClick={() => { setOpen(false); setResult(null); }} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">From place…</option>
          {pins.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">To place…</option>
          {pins.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <button
        onClick={compute}
        disabled={!from || !to || from === to || loading}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Calculating…' : 'Calculate'}
      </button>

      {result && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-center">
          <p className="text-2xl font-bold text-slate-800">{result.distance_km.toLocaleString()} km</p>
          <p className="text-sm text-slate-500">{result.distance_miles.toLocaleString()} miles</p>
        </div>
      )}
    </div>
  );
}
