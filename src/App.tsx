/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CityLocation, WeatherData, Season } from './types';
import { WORLD_CITIES } from './data/worldCities';
import { fetchWeather, getSeasonForLocation, reverseGeocode } from './services/weatherApi';
import { Globe3D } from './components/Globe3D';
import { SeasonalAtmosphere } from './components/SeasonalAtmosphere';
import { WeatherDashboard } from './components/WeatherDashboard';
import { AstronomicalInsights } from './components/AstronomicalInsights';
import { ClimatePassport } from './components/ClimatePassport';
import { TimeTravelSection } from './components/TimeTravelSection';
import { SearchBar } from './components/SearchBar';
import { getSeasonTheme } from './utils/seasonTheme';
import { useLiveClock } from './hooks/useLiveClock';
import {
  Globe,
  Compass,
  Sparkles,
  RefreshCw,
  Umbrella,
  Snowflake,
  Flower2,
  Sun,
  AlertCircle,
  HelpCircle,
  Calendar,
} from 'lucide-react';

export default function App() {
  // 1. Current selected location (Default: Tashkent, Uzbekistan)
  const [selectedLocation, setSelectedLocation] = useState<CityLocation>(WORLD_CITIES[0]);

  // 2. Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Seasonal state
  // Default: Kuz (October)
  const [activeSeason, setActiveSeason] = useState<Season>(() => {
    return getSeasonForLocation(selectedLocation.lat, new Date());
  });
  const [isAutoSeason, setIsAutoSeason] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // 4. Time travel simulation on globe
  const [simulatedSeason, setSimulatedSeason] = useState<Season | undefined>(undefined);
  const [simulatedTempOffset, setSimulatedTempOffset] = useState<number>(0);
  const [activeSimulationLabel, setActiveSimulationLabel] = useState<string | null>(null);

  // Live real-time clock ticking every second for the selected location
  const liveClock = useLiveClock(weather?.location.timezone || selectedLocation.timezone || 'Asia/Tashkent');

  // Detect user's actual location on initial mount (Mening real turgan joyim)
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const loc = await reverseGeocode(position.coords.latitude, position.coords.longitude);
            setSelectedLocation(loc);
          } catch (e) {
            console.warn('Geolocation reverse geocoding failed', e);
          }
        },
        (err) => {
          console.log('GPS not granted or unavailable, using regional default', err);
        },
        { timeout: 6000 }
      );
    }
  }, []);

  const handleLocateMe = async () => {
    if (!('geolocation' in navigator)) {
      alert("Brauzeringizda geolokatsiya qo'llab-quvvatlanmaydi.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setSelectedLocation(loc);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Fetch weather when location changes
  const loadWeather = useCallback(async (location: CityLocation) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(location);
      setWeather(data);

      if (isAutoSeason) {
        const localSeason = getSeasonForLocation(location.lat, new Date());
        setActiveSeason(localSeason);
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Ob-havo ma'lumotlarini yuklashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  }, [isAutoSeason]);

  useEffect(() => {
    loadWeather(selectedLocation);
  }, [selectedLocation, loadWeather]);

  // Handle location selection from Globe or Search
  const handleSelectLocation = (location: CityLocation) => {
    setSelectedLocation(location);
    if (isAutoSeason) {
      setActiveSeason(getSeasonForLocation(location.lat, new Date()));
    }
  };

  // Handle simulation applied to globe from Time Travel
  const handleApplySimulation = (season: Season, tempOffset: number, label: string) => {
    setSimulatedSeason(season);
    setSimulatedTempOffset(tempOffset);
    setActiveSimulationLabel(label);
  };

  const handleResetSimulation = () => {
    setSimulatedSeason(undefined);
    setSimulatedTempOffset(0);
    setActiveSimulationLabel(null);
  };

  const currentSeason = simulatedSeason || activeSeason;
  const theme = getSeasonTheme(currentSeason);

  return (
    <div className={`min-h-screen bg-[#090b0e] text-[#e2e8f0] font-sans ${theme.selectionClass} relative overflow-x-hidden transition-colors duration-500`}>
      {/* Dynamic Seasonal Atmosphere Background Particles & Tree */}
      <SeasonalAtmosphere
        season={currentSeason}
        onSeasonChange={(s) => {
          setActiveSeason(s);
          setIsAutoSeason(false);
          setSimulatedSeason(undefined);
          setActiveSimulationLabel(null);
        }}
        isAutoSeason={isAutoSeason}
        locationName={selectedLocation.nameUz || selectedLocation.name}
        onToggleAutoSeason={() => {
          setIsAutoSeason(true);
          setSimulatedSeason(undefined);
          setActiveSimulationLabel(null);
          setActiveSeason(getSeasonForLocation(selectedLocation.lat, new Date()));
        }}
      />

      {/* Main Content Layout Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-7">
        {/* Header / Brand Bar */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${theme.borderColor} transition-colors duration-500`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${theme.brandGradient} p-0.5 shadow-lg ${theme.glowShadow} transition-all duration-500`}>
              <div className="w-full h-full bg-[#0c0e14] rounded-[14px] flex items-center justify-center text-white">
                <Globe className={`w-6 h-6 animate-spin ${theme.textColor}`} style={{ animationDuration: '30s' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  GLOBUS <span className={`${theme.textColor} font-bold`}>|</span> OB-HAVO & DUNYO VAQTI
                </h1>
                <span className={`hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-mono rounded-md ${theme.badgeBg} ${theme.textHighlight} border ${theme.borderColor} uppercase tracking-widest font-semibold transition-all duration-500`}>
                  Jonli 3D Maket
                </span>
                <span className={`px-2 py-0.5 text-[10px] rounded-md ${theme.badgeBg} ${theme.textColor} border ${theme.borderSubtle} font-medium hidden md:inline-block`}>
                  {theme.seasonTitleUz}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Interaktiv 3D globus orqali dunyoning istalgan nuqtasida vaqt va ob-havoni o'rganing
              </p>
            </div>
          </div>

          {/* Quick Refresh & Hemisphere indicator */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadWeather(selectedLocation)}
              disabled={isLoading}
              title="Ob-havoni yangilash"
              className={`px-4 py-2 rounded-xl ${theme.buttonSecondary} text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${theme.textColor} ${isLoading ? 'animate-spin' : ''}`} />
              <span className={theme.textLight}>{isLoading ? 'Yangilanmoqda...' : 'Yangilash'}</span>
            </button>
          </div>
        </header>

        {/* Global Search and World Capitals bar */}
        <SearchBar
          onSelectCity={handleSelectLocation}
          selectedCityId={selectedLocation.id}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          season={currentSeason}
        />

        {/* Error Notification if any */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main 3D Globe + Quick Details Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 3D Interactive Globe (Takes 7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Compass className={`w-4 h-4 ${theme.textColor}`} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Dunyo Xaritasining 3D Globus Maketi
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Tanlangan: <b className={theme.textHighlight}>{selectedLocation.nameUz || selectedLocation.name}</b>
              </span>
            </div>

            <Globe3D
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              activeSeason={activeSeason}
              simulatedSeason={simulatedSeason}
              simulatedTempOffset={simulatedTempOffset}
            />

            {/* Instruction legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
              <div className={`p-2 rounded-xl bg-[#11131a]/60 border ${theme.borderColor} flex items-center gap-2 transition-colors`}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryHex }} />
                <span className={theme.textLight}>Tanlangan shahar</span>
              </div>
              <div className="p-2 rounded-xl bg-[#11131a]/60 border border-sky-500/20 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>Dunyo poytaxtlari</span>
              </div>
              <div className="p-2 rounded-xl bg-[#11131a]/60 border border-pink-500/20 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                <span>Bosib tanlash</span>
              </div>
              <div className="p-2 rounded-xl bg-[#11131a]/60 border border-emerald-500/20 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Aylantirish & Zoom</span>
              </div>
            </div>
          </div>

          {/* Quick Summary & Location Info Panel (Takes 5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            {weather ? (
              <div className={`p-6 rounded-2xl bg-gradient-to-b ${theme.cardBg} border ${theme.borderColor} shadow-2xl space-y-5 transition-all duration-500`}>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div>
                    <span className={`text-[11px] font-mono ${theme.textColor} font-bold uppercase tracking-wider`}>
                      Tanlangan Hudud
                    </span>
                    <h3 className="text-2xl font-extrabold text-white mt-0.5">
                      {weather.location.nameUz || weather.location.name}
                    </h3>
                    <p className="text-xs text-slate-400">{weather.location.country}</p>
                  </div>

                  <div className="text-right">
                    <span className={`text-4xl font-extrabold ${theme.textHighlight} font-mono`}>
                      {weather.current.temp}°C
                    </span>
                    <div className="text-xs text-slate-300 font-medium">
                      {weather.current.conditionText}
                    </div>
                  </div>
                </div>

                {/* Local time highlights */}
                <div className={`p-4 rounded-xl bg-[#090b10] border ${theme.borderColor} flex items-center justify-between transition-colors`}>
                  <div>
                    <span className={`text-[11px] ${theme.textColor} font-mono font-bold tracking-wider`}>MAHALLIY SOAT</span>
                    <div className="text-2xl font-mono font-bold text-white mt-0.5">
                      {liveClock.timeString}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold text-slate-200">{liveClock.dayOfWeek}</div>
                    <div className="text-slate-400">{liveClock.dateString}</div>
                    <div className={`text-[11px] font-mono ${theme.textHighlight} font-semibold`}>{liveClock.utcOffset}</div>
                  </div>
                </div>

                {/* Micro indicators */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[#11131a] border border-white/5">
                    <span className="text-slate-400 text-[11px]">Namlik</span>
                    <div className="text-lg font-bold font-mono text-sky-300 mt-0.5">
                      {weather.current.humidity}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#11131a] border border-white/5">
                    <span className="text-slate-400 text-[11px]">Shamol tezligi</span>
                    <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
                      {weather.current.windSpeed} km/s
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#11131a] border border-white/5">
                    <span className="text-slate-400 text-[11px]">Atmosfera bosimi</span>
                    <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">
                      {weather.current.pressure} hPa
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#11131a] border border-white/5">
                    <span className="text-slate-400 text-[11px]">UV nurlanishi</span>
                    <div className={`text-lg font-bold font-mono ${theme.textColor} mt-0.5`}>
                      {weather.current.uvIndex} / 11
                    </div>
                  </div>
                </div>

                {/* Seasonal Insight for this City */}
                <div className={`p-3.5 rounded-xl ${theme.badgeBg} border ${theme.borderColor} text-xs ${theme.textLight} leading-relaxed transition-all`}>
                  <div className={`font-semibold ${theme.textHighlight} flex items-center gap-1.5 mb-1`}>
                    <Sparkles className={`w-3.5 h-3.5 ${theme.textColor}`} />
                    <span>Mintaqaviy Fasl Ma'lumoti</span>
                  </div>
                  Ushbu nuqta ({selectedLocation.lat > 0 ? "Shimoliy" : "Janubiy"} yarimsharda) hozirda{' '}
                  <b className="capitalize text-white">{getSeasonForLocation(selectedLocation.lat, new Date())}</b> faslini boshdan kechirmoqda. Globusda ushbu fasl harorat taqsimoti aks ettirilgan.
                </div>
              </div>
            ) : (
              <div className={`p-8 rounded-2xl bg-[#141210] border ${theme.borderColor} text-center text-slate-400`}>
                Ma'lumotlar yuklanmoqda...
              </div>
            )}
          </div>
        </section>

        {/* Detailed Weather Dashboard (Statistics, Charts, Forecasts) */}
        {weather && (
          <section className="space-y-4">
            <WeatherDashboard weather={weather} isLoading={isLoading} season={currentSeason} />
          </section>
        )}

        {/* Astronomical Insights & Sun Trajectory */}
        {weather && (
          <section className="space-y-4">
            <AstronomicalInsights weather={weather} location={selectedLocation} season={currentSeason} />
          </section>
        )}

        {/* Climate Passport (12-Month Climatological Normals & Köppen Classification) */}
        <section className="space-y-4">
          <ClimatePassport location={selectedLocation} season={currentSeason} />
        </section>

        {/* O'tmish va kelajak ob-havo tahlili */}
        {weather && (
          <section className="space-y-4 pt-2">
            <TimeTravelSection
              location={selectedLocation}
              currentWeather={weather}
              onApplySimulationToGlobe={handleApplySimulation}
              onResetSimulation={handleResetSimulation}
              activeSimulationLabel={activeSimulationLabel}
              season={currentSeason}
            />
          </section>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-12 border-t border-white/5 text-center space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <span>© 2026 Globus Ob-Havo & Dunyo Vaqti</span>
            <span>·</span>
            <span>Open-Meteo Global Meteorology</span>
            <span>·</span>
            <span>O'zbekiston & Dunyo Hududlari</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-xl mx-auto">
            4 fasl (Kuz, Qish, Bahor, Yoz — hozirda <b className={theme.textHighlight}>{theme.name}</b> faol) dinamik atmosferasi bilan boyitilgan, fasllarga to'liq moslashuvchan interaktiv veb-platforma.
          </p>
        </footer>
      </div>
    </div>
  );
}
