import { useEffect, useState } from 'react';
import { Globe, MapPin, Ruler, Trophy, TrendingUp, Compass } from 'lucide-react';
import client from '../api/client';
import type { OverviewStats, DistanceStats, Place } from '../types';
import StatCard from '../components/dashboard/StatCard';
import RecentPlaces from '../components/dashboard/RecentPlaces';

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [distances, setDistances] = useState<DistanceStats | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get<OverviewStats>('/stats/overview'),
      client.get<DistanceStats>('/stats/distances'),
      client.get<Place[]>('/places'),
    ]).then(([o, d, p]) => {
      setOverview(o.data);
      setDistances(d.data);
      setPlaces(p.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading dashboard…
      </div>
    );
  }

  const topYear = overview
    ? Object.entries(overview.travel_frequency).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Globe}
          label="Countries Visited"
          value={overview?.total_countries ?? 0}
          sub={`${overview?.country_coverage_pct ?? 0}% of world`}
          color="bg-blue-500"
        />
        <StatCard
          icon={MapPin}
          label="Places Visited"
          value={overview?.total_places ?? 0}
          color="bg-violet-500"
        />
        <StatCard
          icon={Ruler}
          label="Total Distance"
          value={`${(overview?.total_distance_km ?? 0).toLocaleString()} km`}
          sub={`${(distances?.total_distance_miles ?? 0).toLocaleString()} miles`}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Trophy}
          label="Most Visited"
          value={overview?.most_visited_country ?? '—'}
          color="bg-amber-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Busiest Year"
          value={topYear ? `${topYear[0]}` : '—'}
          sub={topYear ? `${topYear[1]} trips` : undefined}
          color="bg-rose-500"
        />
        <StatCard
          icon={Compass}
          label="Longest Trip"
          value={`${(distances?.longest_single_trip_km ?? 0).toLocaleString()} km`}
          color="bg-cyan-500"
        />
      </div>

      {/* Extreme points */}
      {distances?.extremes && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Extreme Points</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            {[
              { label: 'Northernmost', value: distances.extremes.northernmost, emoji: '⬆️' },
              { label: 'Southernmost', value: distances.extremes.southernmost, emoji: '⬇️' },
              { label: 'Easternmost', value: distances.extremes.easternmost, emoji: '➡️' },
              { label: 'Westernmost', value: distances.extremes.westernmost, emoji: '⬅️' },
            ].map(({ label, value, emoji }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xl mb-1">{emoji}</p>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="font-medium text-slate-700 mt-0.5">{value ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent places */}
      <RecentPlaces places={places} />
    </div>
  );
}
