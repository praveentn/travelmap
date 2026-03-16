import { useEffect, useRef, useState } from 'react';
import { Shuffle, RotateCcw, Trophy, Globe, TrendingUp, X } from 'lucide-react';
import client from '../api/client';
import type { Country } from '../types';

const STORAGE_KEY = 'travelmap_country_picks';

interface PickCounts {
  [countryName: string]: number;
}

interface PickEntry {
  country: Country;
  timestamp: number;
}

const SPIN_FRAMES = 22;
const SPIN_INTERVAL_START = 60;
const SPIN_INTERVAL_END = 160;

function useCountryPickCounts() {
  const [counts, setCounts] = useState<PickCounts>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
  });
  const [recentPicks, setRecentPicks] = useState<PickEntry[]>([]);

  const recordPick = (country: Country) => {
    setCounts((prev) => {
      const next = { ...prev, [country.name]: (prev[country.name] ?? 0) + 1 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setRecentPicks((prev) => [{ country, timestamp: Date.now() }, ...prev].slice(0, 10));
  };

  const resetCounts = () => {
    setCounts({});
    setRecentPicks([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { counts, recentPicks, recordPick, resetCounts };
}

function getEmoji(isoCode: string): string {
  // Country flag emoji from ISO 3166-1 alpha-3 code (convert to alpha-2 approx by using Unicode regional indicators)
  // We'll use a simple lookup for common countries, or fallback to globe
  // ISO 3-letter to flag emoji: map first two chars
  const map: Record<string, string> = {
    AFG: '🇦🇫', ALB: '🇦🇱', DZA: '🇩🇿', AND: '🇦🇩', AGO: '🇦🇴', ARG: '🇦🇷', ARM: '🇦🇲',
    AUS: '🇦🇺', AUT: '🇦🇹', AZE: '🇦🇿', BHS: '🇧🇸', BHR: '🇧🇭', BGD: '🇧🇩', BLR: '🇧🇾',
    BEL: '🇧🇪', BLZ: '🇧🇿', BEN: '🇧🇯', BTN: '🇧🇹', BOL: '🇧🇴', BIH: '🇧🇦', BWA: '🇧🇼',
    BRA: '🇧🇷', BRN: '🇧🇳', BGR: '🇧🇬', BFA: '🇧🇫', BDI: '🇧🇮', CPV: '🇨🇻', KHM: '🇰🇭',
    CMR: '🇨🇲', CAN: '🇨🇦', CAF: '🇨🇫', TCD: '🇹🇩', CHL: '🇨🇱', CHN: '🇨🇳', COL: '🇨🇴',
    COM: '🇰🇲', COD: '🇨🇩', COG: '🇨🇬', CRI: '🇨🇷', CIV: '🇨🇮', HRV: '🇭🇷', CUB: '🇨🇺',
    CYP: '🇨🇾', CZE: '🇨🇿', DNK: '🇩🇰', DJI: '🇩🇯', DOM: '🇩🇴', ECU: '🇪🇨', EGY: '🇪🇬',
    SLV: '🇸🇻', GNQ: '🇬🇶', ERI: '🇪🇷', EST: '🇪🇪', SWZ: '🇸🇿', ETH: '🇪🇹', FJI: '🇫🇯',
    FIN: '🇫🇮', FRA: '🇫🇷', GAB: '🇬🇦', GMB: '🇬🇲', GEO: '🇬🇪', DEU: '🇩🇪', GHA: '🇬🇭',
    GRC: '🇬🇷', GTM: '🇬🇹', GIN: '🇬🇳', GNB: '🇬🇼', GUY: '🇬🇾', HTI: '🇭🇹', HND: '🇭🇳',
    HUN: '🇭🇺', ISL: '🇮🇸', IND: '🇮🇳', IDN: '🇮🇩', IRN: '🇮🇷', IRQ: '🇮🇶', IRL: '🇮🇪',
    ISR: '🇮🇱', ITA: '🇮🇹', JAM: '🇯🇲', JPN: '🇯🇵', JOR: '🇯🇴', KAZ: '🇰🇿', KEN: '🇰🇪',
    PRK: '🇰🇵', KOR: '🇰🇷', KWT: '🇰🇼', KGZ: '🇰🇬', LAO: '🇱🇦', LVA: '🇱🇻', LBN: '🇱🇧',
    LSO: '🇱🇸', LBR: '🇱🇷', LBY: '🇱🇾', LIE: '🇱🇮', LTU: '🇱🇹', LUX: '🇱🇺', MDG: '🇲🇬',
    MWI: '🇲🇼', MYS: '🇲🇾', MDV: '🇲🇻', MLI: '🇲🇱', MLT: '🇲🇹', MRT: '🇲🇷', MUS: '🇲🇺',
    MEX: '🇲🇽', MDA: '🇲🇩', MCO: '🇲🇨', MNG: '🇲🇳', MNE: '🇲🇪', MAR: '🇲🇦', MOZ: '🇲🇿',
    MMR: '🇲🇲', NAM: '🇳🇦', NPL: '🇳🇵', NLD: '🇳🇱', NZL: '🇳🇿', NIC: '🇳🇮', NER: '🇳🇪',
    NGA: '🇳🇬', MKD: '🇲🇰', NOR: '🇳🇴', OMN: '🇴🇲', PAK: '🇵🇰', PAN: '🇵🇦', PNG: '🇵🇬',
    PRY: '🇵🇾', PER: '🇵🇪', PHL: '🇵🇭', POL: '🇵🇱', PRT: '🇵🇹', QAT: '🇶🇦', ROU: '🇷🇴',
    RUS: '🇷🇺', RWA: '🇷🇼', SAU: '🇸🇦', SEN: '🇸🇳', SRB: '🇷🇸', SLE: '🇸🇱', SGP: '🇸🇬',
    SVK: '🇸🇰', SVN: '🇸🇮', SOM: '🇸🇴', ZAF: '🇿🇦', SSD: '🇸🇸', ESP: '🇪🇸', LKA: '🇱🇰',
    SDN: '🇸🇩', SUR: '🇸🇷', SWE: '🇸🇪', CHE: '🇨🇭', SYR: '🇸🇾', TWN: '🇹🇼', TJK: '🇹🇯',
    TZA: '🇹🇿', THA: '🇹🇭', TLS: '🇹🇱', TGO: '🇹🇬', TTO: '🇹🇹', TUN: '🇹🇳', TUR: '🇹🇷',
    TKM: '🇹🇲', UGA: '🇺🇬', UKR: '🇺🇦', ARE: '🇦🇪', GBR: '🇬🇧', USA: '🇺🇸', URY: '🇺🇾',
    UZB: '🇺🇿', VEN: '🇻🇪', VNM: '🇻🇳', YEM: '🇾🇪', ZMB: '🇿🇲', ZWE: '🇿🇼',
  };
  return map[isoCode] ?? '🌍';
}

export default function CountryPickerPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [pickedCountry, setPickedCountry] = useState<Country | null>(null);
  const [spinDisplay, setSpinDisplay] = useState<Country | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { counts, recentPicks, recordPick, resetCounts } = useCountryPickCounts();
  const spinRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    client.get<Country[]>('/countries').then((r) => setCountries(r.data));
    return () => { if (spinRef.current) clearTimeout(spinRef.current); };
  }, []);

  const handleSpin = () => {
    if (isSpinning || countries.length === 0) return;
    setIsSpinning(true);
    setPickedCountry(null);

    const finalCountry = countries[Math.floor(Math.random() * countries.length)];
    let frame = 0;

    const step = () => {
      const progress = frame / SPIN_FRAMES;
      const interval = SPIN_INTERVAL_START + (SPIN_INTERVAL_END - SPIN_INTERVAL_START) * (progress * progress);

      const random = countries[Math.floor(Math.random() * countries.length)];
      setSpinDisplay(random);

      frame++;
      if (frame < SPIN_FRAMES) {
        spinRef.current = setTimeout(step, interval);
      } else {
        setSpinDisplay(finalCountry);
        setPickedCountry(finalCountry);
        setIsSpinning(false);
        recordPick(finalCountry);
      }
    };

    step();
  };

  const totalPicks = Object.values(counts).reduce((a, b) => a + b, 0);

  const topCountries = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const displayCountry = spinDisplay ?? pickedCountry;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Random Country Picker</h1>
        <p className="text-slate-500 text-sm">Spin to discover your next adventure destination</p>
      </div>

      {/* Main spinner card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Gradient top band */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="p-8 text-center">
          {/* Display area */}
          <div
            className={`relative mx-auto w-56 h-56 rounded-3xl flex flex-col items-center justify-center mb-8 transition-all duration-300 ${
              isSpinning
                ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 scale-105'
                : pickedCountry
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-lg shadow-blue-100'
                  : 'bg-slate-50 border-2 border-dashed border-slate-200'
            }`}
          >
            {displayCountry ? (
              <>
                <span
                  className={`text-7xl mb-3 transition-all ${isSpinning ? 'blur-[2px] scale-90' : 'scale-100'}`}
                  style={{ filter: isSpinning ? 'blur(1px)' : 'none' }}
                >
                  {getEmoji(displayCountry.iso_code)}
                </span>
                <p
                  className={`text-lg font-bold text-slate-800 px-4 text-center leading-tight transition-all ${
                    isSpinning ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  {displayCountry.name}
                </p>
                {!isSpinning && pickedCountry && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    {pickedCountry.iso_code} · Picked {counts[pickedCountry.name] ?? 1}×
                  </p>
                )}
              </>
            ) : (
              <>
                <Globe size={48} className="text-slate-300 mb-3" />
                <p className="text-sm text-slate-400 font-medium">Press Spin!</p>
              </>
            )}

            {/* Spinning ring animation */}
            {isSpinning && (
              <div className="absolute inset-0 rounded-3xl border-4 border-violet-400 border-t-transparent animate-spin" />
            )}
          </div>

          {/* Spin button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || countries.length === 0}
            className={`inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-base transition-all ${
              isSpinning
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-lg shadow-purple-200 hover:scale-105 hover:shadow-xl active:scale-95'
            }`}
          >
            <Shuffle size={20} className={isSpinning ? 'animate-spin' : ''} />
            {isSpinning ? 'Spinning…' : 'Spin the Globe'}
          </button>

          {totalPicks > 0 && (
            <p className="text-xs text-slate-400 mt-4">{totalPicks} spin{totalPicks !== 1 ? 's' : ''} total</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      {totalPicks > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{totalPicks}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total spins</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{Object.keys(counts).length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Unique countries</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            {topCountries[0] ? (
              <>
                <p className="text-xl font-bold text-slate-800 truncate">{getEmoji((countries.find(c => c.name === topCountries[0][0])?.iso_code ?? ''))}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{topCountries[0][0]}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-300">—</p>
                <p className="text-xs text-slate-400 mt-0.5">Top pick</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent picks */}
      {recentPicks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <RotateCcw size={14} className="text-slate-400" />
              Recent picks
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentPicks.map((pick, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1.5 text-sm"
              >
                <span>{getEmoji(pick.country.iso_code)}</span>
                <span className="font-medium text-slate-700">{pick.country.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {topCountries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Trophy size={14} className="text-amber-500" />
              Most picked countries
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showLeaderboard ? 'Show less' : 'Show all'}
              </button>
              <button
                onClick={() => { if (confirm('Reset all pick counts?')) resetCounts(); }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {(showLeaderboard ? topCountries : topCountries.slice(0, 5)).map(([name, count], i) => {
              const country = countries.find((c) => c.name === name);
              const maxCount = topCountries[0]?.[1] ?? 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={name} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center">#{i + 1}</span>
                  <span className="text-xl">{country ? getEmoji(country.iso_code) : '🌍'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate">{name}</span>
                      <span className="text-xs font-bold text-slate-500 ml-2">{count}×</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
