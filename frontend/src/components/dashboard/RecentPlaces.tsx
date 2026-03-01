import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import type { Place } from '../../types';

interface RecentPlacesProps {
  places: Place[];
}

export default function RecentPlaces({ places }: RecentPlacesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Recent Places</h3>
        <Link to="/places" className="text-sm text-blue-600 hover:underline">View all</Link>
      </div>
      {places.length === 0 ? (
        <div className="px-5 py-8 text-center text-slate-400 text-sm">
          No places added yet. <Link to="/map" className="text-blue-600 hover:underline">Add your first place →</Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {places.slice(0, 5).map((place) => (
            <li key={place.id}>
              <Link to={`/places/${place.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{place.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {place.country?.name ?? 'Unknown'} {place.visit_start ? `· ${place.visit_start}` : ''}
                  </p>
                </div>
                {place.rating != null && (
                  <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                    <Star size={13} fill="currentColor" />
                    <span className="text-xs font-medium">{place.rating}</span>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
