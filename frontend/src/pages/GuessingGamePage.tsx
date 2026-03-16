import { useCallback, useEffect, useRef, useState } from 'react';
import { Trophy, RefreshCw, CheckCircle2, XCircle, MapPin, Star, ChevronRight, History, X, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import type { Country } from '../types';

const API_BASE = 'http://localhost:7768';
const STORAGE_KEY = 'travelmap_quiz_history';

interface QuizPhoto {
  image_url: string;
  image_id: string;
  place_id: string;
  place_name: string;
  country_name: string | null;
  country_id: number | null;
  total_photos: number;
}

interface HistoryEntry {
  image_url: string;
  place_name: string;
  country_name: string | null;
  user_guess: string | null;
  correct: boolean;
  skipped: boolean;
  timestamp: number;
}

type GameState = 'idle' | 'playing' | 'revealed' | 'no_photos';

const CHOICE_COUNT = 4;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(correct: Country | null, allCountries: Country[]): Country[] {
  if (!correct) return [];
  const others = shuffle(allCountries.filter((c) => c.id !== correct.id)).slice(0, CHOICE_COUNT - 1);
  return shuffle([correct, ...others]);
}

export default function GuessingGamePage() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentPhoto, setCurrentPhoto] = useState<QuizPhoto | null>(null);
  const [choices, setChoices] = useState<Country[]>([]);
  const [selectedGuess, setSelectedGuess] = useState<Country | null>(null);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    client.get<Country[]>('/countries').then((r) => setAllCountries(r.data));
  }, []);

  const saveHistory = (entries: HistoryEntry[]) => {
    setHistory(entries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  };

  const fetchNextPhoto = useCallback(async () => {
    setLoading(true);
    setImgLoaded(false);
    setSelectedGuess(null);
    try {
      const res = await client.get<QuizPhoto>('/quiz/random-photo');
      const photo = res.data;
      setCurrentPhoto(photo);
      setGameState('playing');

      // Build multiple-choice options
      const correctCountry = allCountries.find((c) => c.id === photo.country_id) ?? null;
      if (correctCountry) {
        setChoices(buildChoices(correctCountry, allCountries));
      } else {
        setChoices([]);
      }
      seenIds.current.add(photo.image_id);
    } catch (err: any) {
      if (err.response?.status === 404) setGameState('no_photos');
    } finally {
      setLoading(false);
    }
  }, [allCountries]);

  const handleGuess = (country: Country) => {
    if (gameState !== 'playing' || !currentPhoto) return;
    setSelectedGuess(country);
    setGameState('revealed');

    const correct = country.id === currentPhoto.country_id;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));

    const entry: HistoryEntry = {
      image_url: currentPhoto.image_url,
      place_name: currentPhoto.place_name,
      country_name: currentPhoto.country_name,
      user_guess: country.name,
      correct,
      skipped: false,
      timestamp: Date.now(),
    };
    saveHistory([entry, ...history].slice(0, 50));
  };

  const handleSkip = () => {
    if (!currentPhoto) return;
    const entry: HistoryEntry = {
      image_url: currentPhoto.image_url,
      place_name: currentPhoto.place_name,
      country_name: currentPhoto.country_name,
      user_guess: null,
      correct: false,
      skipped: true,
      timestamp: Date.now(),
    };
    saveHistory([entry, ...history].slice(0, 50));
    fetchNextPhoto();
  };

  const handleStart = () => {
    setScore({ correct: 0, total: 0 });
    seenIds.current.clear();
    fetchNextPhoto();
  };

  const handleReset = () => {
    setGameState('idle');
    setCurrentPhoto(null);
    setScore({ correct: 0, total: 0 });
    seenIds.current.clear();
  };

  const handleClearHistory = () => {
    if (!confirm('Clear all quiz history?')) return;
    saveHistory([]);
  };

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // ── Idle screen ────────────────────────────────────────────────────────────
  if (gameState === 'idle') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16 px-6">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-200">
            <Camera size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">Photo Quiz</h1>
          <p className="text-slate-500 text-lg mb-2">Can you guess the country from your travel photos?</p>
          <p className="text-sm text-slate-400 mb-8">Your uploaded photos are shown one at a time — pick the right country!</p>

          <button
            onClick={handleStart}
            disabled={allCountries.length === 0}
            className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
          >
            Start Quiz
          </button>

          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="mt-4 flex items-center gap-2 mx-auto text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <History size={15} />
              View history ({history.length} rounds)
            </button>
          )}
        </div>

        {/* Previous best */}
        {history.length > 0 && (() => {
          const total = history.filter((h) => !h.skipped).length;
          const correct = history.filter((h) => h.correct).length;
          return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">All-time record</p>
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-slate-800">{total > 0 ? Math.round((correct / total) * 100) : 0}%</p>
                  <p className="text-xs text-slate-400 mt-0.5">Accuracy</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">{correct}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Correct</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">{total}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Played</p>
                </div>
              </div>
            </div>
          );
        })()}

        {showHistory && <HistoryModal history={history} onClose={() => setShowHistory(false)} onClear={handleClearHistory} />}
      </div>
    );
  }

  // ── No photos ───────────────────────────────────────────────────────────────
  if (gameState === 'no_photos') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Camera size={28} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">No photos yet</h2>
        <p className="text-slate-500 text-sm mb-6">Upload photos to your places to start playing the quiz!</p>
        <Link to="/places" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <MapPin size={15} /> Go to Places
        </Link>
      </div>
    );
  }

  // ── Playing / Revealed ─────────────────────────────────────────────────────
  const isCorrect = selectedGuess?.id === currentPhoto?.country_id;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Score bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-sm font-bold text-slate-800">{score.correct}</span>
            <span className="text-xs text-slate-400">correct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle size={16} className="text-red-400" />
            <span className="text-sm font-bold text-slate-800">{score.total - score.correct}</span>
            <span className="text-xs text-slate-400">wrong</span>
          </div>
          {score.total > 0 && (
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-sm font-semibold text-amber-600">{accuracy}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            title="History"
          >
            <History size={16} />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            title="Reset game"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Photo card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="relative aspect-video bg-slate-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {currentPhoto && (
            <img
              key={currentPhoto.image_id}
              src={`${API_BASE}${currentPhoto.image_url}`}
              alt="Guess the country"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          {/* Blur overlay before reveal */}
          {gameState === 'playing' && imgLoaded && (
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          )}
          {/* Revealed answer overlay */}
          {gameState === 'revealed' && currentPhoto && (
            <div className={`absolute inset-0 flex items-end p-4 ${isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm ${isCorrect ? 'bg-emerald-500/90' : 'bg-red-500/90'} text-white`}>
                {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <div>
                  <p className="text-sm font-bold">{isCorrect ? 'Correct!' : 'Not quite…'}</p>
                  <p className="text-xs opacity-90">
                    {currentPhoto.country_name
                      ? `This is ${currentPhoto.place_name} in ${currentPhoto.country_name}`
                      : currentPhoto.place_name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Question prompt */}
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Question</p>
          <p className="text-lg font-semibold text-slate-800">Which country is this?</p>
        </div>

        {/* Choices */}
        <div className="p-4">
          {choices.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {choices.map((country) => {
                const isSelected = selectedGuess?.id === country.id;
                const isAnswer = country.id === currentPhoto?.country_id;
                let btnClass = 'relative flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ';

                if (gameState === 'revealed') {
                  if (isAnswer) {
                    btnClass += 'border-emerald-400 bg-emerald-50 text-emerald-700';
                  } else if (isSelected && !isAnswer) {
                    btnClass += 'border-red-400 bg-red-50 text-red-700';
                  } else {
                    btnClass += 'border-slate-200 bg-slate-50 text-slate-400';
                  }
                } else {
                  btnClass += 'border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 cursor-pointer';
                }

                return (
                  <button
                    key={country.id}
                    onClick={() => handleGuess(country)}
                    disabled={gameState === 'revealed'}
                    className={btnClass}
                  >
                    <MapPin size={14} className="flex-shrink-0" />
                    <span className="truncate">{country.name}</span>
                    {gameState === 'revealed' && isAnswer && (
                      <CheckCircle2 size={14} className="ml-auto flex-shrink-0 text-emerald-500" />
                    )}
                    {gameState === 'revealed' && isSelected && !isAnswer && (
                      <XCircle size={14} className="ml-auto flex-shrink-0 text-red-400" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* No country on this place — free text fallback info */
            <div className="text-center py-4 text-sm text-slate-400">
              {gameState === 'revealed'
                ? <p>This photo is from <span className="font-medium text-slate-600">{currentPhoto?.place_name}</span> — no country tagged.</p>
                : <p className="italic">No country options available for this photo.</p>
              }
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2.5">
          {gameState === 'playing' && (
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 border border-slate-200 text-slate-500 text-sm rounded-xl hover:bg-slate-50 transition-colors"
            >
              Skip
            </button>
          )}
          {gameState === 'revealed' && (
            <>
              <Link
                to={`/places/${currentPhoto?.place_id}`}
                className="flex items-center justify-center gap-1.5 flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Star size={14} /> View place
              </Link>
              <button
                onClick={fetchNextPhoto}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Next photo <ChevronRight size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {showHistory && <HistoryModal history={history} onClose={() => setShowHistory(false)} onClear={handleClearHistory} />}
    </div>
  );
}

// ── History modal ─────────────────────────────────────────────────────────────
function HistoryModal({
  history,
  onClose,
  onClear,
}: {
  history: HistoryEntry[];
  onClose: () => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Quiz History</h3>
            <p className="text-xs text-slate-400 mt-0.5">{history.length} rounds played</p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button onClick={onClear} className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No history yet</div>
          ) : (
            history.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={`${API_BASE}${entry.image_url}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{entry.place_name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {entry.skipped
                      ? 'Skipped'
                      : entry.correct
                        ? `✓ ${entry.user_guess}`
                        : `✗ Guessed: ${entry.user_guess} · Answer: ${entry.country_name ?? '—'}`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {entry.skipped ? (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">skipped</span>
                  ) : entry.correct ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
