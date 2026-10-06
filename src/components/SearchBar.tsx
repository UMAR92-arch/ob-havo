import React, { useState, useEffect, useRef } from 'react';
import { CityLocation, Season } from '../types';
import { searchCities } from '../services/weatherApi';
import { WORLD_CITIES } from '../data/worldCities';
import { getSeasonTheme } from '../utils/seasonTheme';
import { Search, MapPin, X, Loader2, Sparkles, Navigation } from 'lucide-react';

interface SearchBarProps {
  onSelectCity: (city: CityLocation) => void;
  selectedCityId?: string;
  onLocateMe?: () => void;
  isLocating?: boolean;
  season?: Season;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectCity,
  selectedCityId,
  onLocateMe,
  isLocating,
  season = 'kuz',
}) => {
  const theme = getSeasonTheme(season);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchCities(query);
        setResults(found);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4 Seasons decorative color themes for city quick buttons (Random / balanced across 4 seasons)
  const seasonalButtonStyles = [
    // Kuz (Autumn): Amber / Och qahrabo
    'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-400',
    // Qish (Winter): Muzdek Moviy / Cyan
    'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30 hover:border-sky-400',
    // Bahor (Spring): Shaftoli guli / Pushti
    'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border-pink-500/30 hover:border-pink-400',
    // Yoz (Summer): Yorqin Zumrad / Sariq
    'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400',
  ];

  return (
    <div ref={containerRef} className="w-full space-y-3 relative z-30">
      {/* Search Input Bar + GPS Auto-Locate Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {isLoading ? (
              <Loader2 className={`w-4 h-4 animate-spin ${theme.textColor}`} />
            ) : (
              <Search className={`w-4 h-4 ${theme.textColor}`} />
            )}
          </div>

          <input
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Dunyoning istalgan shahrini yoki davlatini qidiring (masalan: Toshkent, Samarqand, Tokio)..."
            className={`w-full pl-10 pr-10 py-3 rounded-2xl bg-[#141210]/90 backdrop-blur-md border ${theme.borderColor} text-sm text-white placeholder-slate-400 focus:outline-none focus:border-${theme.textColor.replace('text-', '')} shadow-xl transition-all`}
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dropdown Auto-complete list */}
          {isOpen && (results.length > 0 || isLoading) && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#12100d]/95 backdrop-blur-xl border ${theme.borderColor} shadow-2xl max-h-72 overflow-y-auto z-50 p-2 scrollbar-thin`}>
              {isLoading && results.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className={`w-4 h-4 animate-spin ${theme.textColor}`} />
                  <span>Shaharlar qidirilmoqda...</span>
                </div>
              )}

              {results.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    onSelectCity(city);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${theme.badgeBg} ${theme.textColor} transition-colors`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-sm font-medium text-slate-200 group-hover:${theme.textHighlight}`}>
                        {city.nameUz || city.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {city.country} {city.region ? `· ${city.region}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className={`text-right text-[11px] font-mono ${theme.textColor}`}>
                    {city.lat.toFixed(1)}°, {city.lng.toFixed(1)}°
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {onLocateMe && (
          <button
            onClick={onLocateMe}
            disabled={isLocating}
            title="Mening real turgan joyimni aniqlash"
            className={`px-4 py-3 rounded-2xl ${theme.buttonSecondary} text-xs font-semibold flex items-center gap-2 shrink-0 transition-all shadow-lg disabled:opacity-50`}
          >
            {isLocating ? (
              <Loader2 className={`w-4 h-4 animate-spin ${theme.textColor}`} />
            ) : (
              <Navigation className={`w-4 h-4 ${theme.textColor}`} />
            )}
            <span className="hidden sm:inline">{isLocating ? 'Aniqlanmoqda...' : 'Mening Joyim'}</span>
          </button>
        )}
      </div>

      {/* Quick Select Major World Hubs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className={`w-3.5 h-3.5 ${theme.textColor}`} />
          <span className={theme.textHighlight}>Markazlar:</span>
        </span>

        {WORLD_CITIES.slice(0, 10).map((city) => {
          const isSelected = selectedCityId === city.id;

          return (
            <button
              key={city.id}
              onClick={() => onSelectCity(city)}
              className={`px-3 py-1 text-xs font-medium rounded-xl border shrink-0 transition-all shadow-sm ${
                isSelected
                  ? `${theme.interactiveActive} font-bold scale-105 shadow-md`
                  : `${theme.buttonPreset} hover:scale-102`
              }`}
            >
              {city.nameUz || city.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
