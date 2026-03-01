import { Link } from 'react-router-dom';
import { MapPin, Star, Calendar, DollarSign } from 'lucide-react';
import type { Place } from '../../types';

interface PlaceCardProps {
  place: Place;
  onDelete: (id: string) => void;
}

export default function PlaceCard({ place, onDelete }: PlaceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden">
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 h-24 flex items-center justify-center">
        <MapPin size={32} className="text-white/80" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/places/${place.id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors leading-tight">
            {place.name}
          </Link>
          {place.rating != null && (
            <div className="flex items-center gap-0.5 text-amber-500 flex-shrink-0">
              <Star size={13} fill="currentColor" />
              <span className="text-xs font-semibold">{place.rating}</span>
            </div>
          )}
        </div>

        {place.country && (
          <p className="text-xs text-slate-500 mb-3">{place.country.name}</p>
        )}

        <div className="space-y-1.5 text-xs text-slate-500">
          {place.visit_start && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{place.visit_start}{place.visit_end ? ` – ${place.visit_end}` : ''}</span>
            </div>
          )}
          {place.budget != null && (
            <div className="flex items-center gap-1.5">
              <DollarSign size={12} />
              <span>${place.budget.toLocaleString()}</span>
            </div>
          )}
        </div>

        {place.travel_purpose && (
          <span className="inline-block mt-3 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
            {place.travel_purpose}
          </span>
        )}

        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
          <Link
            to={`/places/${place.id}`}
            className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View details
          </Link>
          <button
            onClick={() => {
              if (confirm('Delete this place?')) onDelete(place.id);
            }}
            className="flex-1 text-center text-xs font-medium text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
