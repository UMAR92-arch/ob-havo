import React, { useState } from 'react';
import { CityLocation, WeatherData, TimeUnit, HistoricalComparison, FutureForecastResult, Season } from '../types';
import { calculateHistoricalWeather, calculateFutureWeather } from '../services/weatherApi';
import { getSeasonTheme } from '../utils/seasonTheme';
import { History, Sparkles, AlertTriangle, ArrowRight, RotateCcw, Calendar, TrendingUp, TrendingDown, Thermometer, Droplets, CloudRain } from 'lucide-react';

interface TimeTravelSectionProps {
  location: CityLocation;
  currentWeather: WeatherData;
  onApplySimulationToGlobe: (season: Season, tempOffset: number, label: string) => void;
  onResetSimulation: () => void;
  activeSimulationLabel?: string | null;
  season?: Season;
}

export const TimeTravelSection: React.FC<TimeTravelSectionProps> = ({
  location,
  currentWeather,
  onApplySimulationToGlobe,
  onResetSimulation,
  activeSimulationLabel,
  season = 'kuz',
}) => {
  const theme = getSeasonTheme(season);

  // Left side: Past
  const [pastAmount, setPastAmount] = useState<number>(30);
  const [pastUnit, setPastUnit] = useState<TimeUnit>('kun');
  const [pastResult, setPastResult] = useState<HistoricalComparison | null>(null);
  const [isPastLoading, setIsPastLoading] = useState(false);

  // Right side: Future
  const [futureAmount, setFutureAmount] = useState<number>(45);
  const [futureUnit, setFutureUnit] = useState<TimeUnit>('kun');
  const [futureResult, setFutureResult] = useState<FutureForecastResult | null>(null);
  const [isFutureLoading, setIsFutureLoading] = useState(false);

  // Quick preset handlers
  const handlePastAnalyze = async () => {
    if (pastAmount <= 0) return;
    setIsPastLoading(true);
    try {
      const res = await calculateHistoricalWeather(location, currentWeather, pastAmount, pastUnit);
      setPastResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPastLoading(false);
    }
  };

  const handleFutureAnalyze = async () => {
    if (futureAmount <= 0) return;
    setIsFutureLoading(true);
    try {
      const res = await calculateFutureWeather(location, currentWeather, futureAmount, futureUnit);
      setFutureResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFutureLoading(false);
    }
  };

  // Check if future amount exceeds 1 month (~30 days)
  const isFutureExceedingMonth =
    (futureUnit === 'kun' && futureAmount > 30) ||
    (futureUnit === 'hafta' && futureAmount > 4) ||
    (futureUnit === 'oy' && futureAmount >= 1) ||
    futureUnit === 'yil';

  return (
    <div className={`w-full rounded-2xl bg-[#141210]/95 backdrop-blur-xl border ${theme.borderColor} p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-colors duration-500`}>
      {/* Decorative background aura */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl ${theme.badgeBg} border ${theme.borderColor} ${theme.textColor} shadow-lg`}>
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              O'tmish va kelajak ob-havo tahlili
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            <span className={`${theme.textHighlight} font-medium`}>{location.nameUz || location.name}</span> hududi bo'yicha kundan boshlab yilgacha bo'lgan vaqt oralig'idagi o'tmish va kelajak ob-havo holatini tahlil qiling va globusga simulyatsiya qiling.
          </p>
        </div>

        {activeSimulationLabel && (
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${theme.badgeBg} border ${theme.borderColor} ${theme.textLight} text-xs`}>
            <Sparkles className={`w-3.5 h-3.5 ${theme.textColor} animate-spin`} />
            <span>Faol simulyatsiya: {activeSimulationLabel}</span>
            <button
              onClick={onResetSimulation}
              className={`ml-2 px-2.5 py-1 rounded-lg ${theme.buttonSecondary} font-semibold transition-all shadow-sm`}
            >
              Qaytarish
            </button>
          </div>
        )}
      </div>

      {/* Two Sides Grid: Chap taraf (O'tmish) & O'ng taraf (Kelajak) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6">
        {/* ================= CHAP TARAF: O'TMISH TAHLILI ================= */}
        <div className={`flex flex-col p-5 rounded-2xl bg-[#0f1118]/80 border ${theme.borderColor} ${theme.borderHover} transition-all`}>
          <div className={`flex items-center justify-between pb-3 border-b ${theme.borderColor}`}>
            <div className="flex items-center gap-2">
              <History className={`w-5 h-5 ${theme.textColor}`} />
              <h3 className={`font-semibold ${theme.textHighlight} text-base`}>
                Chap Taraf: O'tmishdagi Ob-Havo Tahlili
              </h3>
            </div>
            <span className={`text-[11px] font-mono ${theme.textColor} uppercase tracking-wider`}>
              Tarixiy tahlil
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Necha kun, hafta, oy yoki yil oldingi ob-havoni ko'rmoqchisiz? Son va vaqt birligini kiriting:
          </p>

          {/* Input Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mt-4">
            <div className="sm:col-span-6">
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Sonni kiriting</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={pastAmount}
                onChange={(e) => setPastAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border ${theme.borderColor} text-white font-mono text-sm focus:outline-none transition-colors`}
                placeholder="Masalan: 30"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Vaqt birligi</label>
              <select
                value={pastUnit}
                onChange={(e) => setPastUnit(e.target.value as TimeUnit)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border ${theme.borderColor} text-white text-sm focus:outline-none transition-colors`}
              >
                <option value="kun">Kun (Kun oldin)</option>
                <option value="hafta">Hafta (Hafta oldin)</option>
                <option value="oy">Oy (Oy oldin)</option>
                <option value="yil">Yil (Yil oldin)</option>
              </select>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className={`text-[11px] ${theme.textColor} font-medium`}>Tezkor:</span>
            {[
              { val: 7, unit: 'kun', label: '7 kun' },
              { val: 1, unit: 'oy', label: '1 oy' },
              { val: 6, unit: 'oy', label: '6 oy' },
              { val: 1, unit: 'yil', label: '1 yil' },
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPastAmount(p.val);
                  setPastUnit(p.unit as TimeUnit);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] ${theme.buttonPreset} transition-all`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handlePastAnalyze}
            disabled={isPastLoading}
            className={`w-full mt-4 py-2.5 px-4 rounded-xl font-medium text-sm ${theme.buttonPrimary} flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isPastLoading ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <History className="w-4 h-4" />
            )}
            <span>{isPastLoading ? 'Tahlil qilinmoqda...' : 'O\'tmish Ob-Havosini Tahlil Qilish'}</span>
          </button>

          {/* Past Result Display */}
          {pastResult && (
            <div className={`mt-5 p-4 rounded-xl bg-[#070b13] border ${theme.borderColor} flex flex-col gap-3`}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Tarixiy sana:{' '}
                  <b className={theme.textHighlight}>
                    {new Date(pastResult.targetDate + 'T00:00:00').toLocaleDateString('uz-UZ', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </b>
                </span>
                <span className={`font-mono text-[11px] ${theme.textColor}`}>-{pastResult.daysAgo} kun oldin</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {pastResult.temp}°C
                  </div>
                  <div className={`text-xs ${theme.textLight} mt-0.5`}>
                    {pastResult.conditionText}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-semibold flex items-center gap-1 justify-end ${
                    pastResult.tempDiff > 0 ? 'text-amber-400' : 'text-sky-400'
                  }`}>
                    {pastResult.tempDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>Bugungiga nisbatan: {pastResult.tempDiff > 0 ? `+${pastResult.tempDiff}°C` : `${pastResult.tempDiff}°C`}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Bugun: {currentWeather.current.temp}°C
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Droplets className={`w-3.5 h-3.5 ${theme.textColor}`} />
                  <span>Namlik: <b>{pastResult.humidity}%</b></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CloudRain className={`w-3.5 h-3.5 ${theme.textColor}`} />
                  <span>Yog'in: <b>{pastResult.precipitation} mm</b></span>
                </div>
              </div>

              <p className={`text-[11px] leading-relaxed text-slate-400 italic ${theme.badgeBg} p-2.5 rounded-lg border ${theme.borderSubtle}`}>
                {pastResult.description}
              </p>

              {/* Apply to Globe Button */}
              <button
                onClick={() => {
                  const simulatedOffset = Math.round(pastResult.temp - currentWeather.current.temp);
                  onApplySimulationToGlobe(
                    simulatedOffset > 4 ? 'yoz' : simulatedOffset < -4 ? 'qish' : 'kuz',
                    simulatedOffset,
                    `${pastResult.timeUnitDesc} avvalgi holat (${pastResult.temp}°C)`
                  );
                }}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold ${theme.buttonSecondary} transition-all flex items-center justify-center gap-1.5 shadow-md`}
              >
                <span>🌍 Globusda ushbu o'tmish ob-havo tahlilini aks ettirish</span>
              </button>
            </div>
          )}
        </div>

        {/* ================= O'NG TARAF: KELAJAK OB-HAVO TAHLILI ================= */}
        <div className={`flex flex-col p-5 rounded-2xl bg-[#140e11]/80 border ${theme.borderColor} ${theme.borderHover} transition-all`}>
          <div className={`flex items-center justify-between pb-3 border-b ${theme.borderColor}`}>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${theme.textColor}`} />
              <h3 className={`font-semibold ${theme.textHighlight} text-base`}>
                O'ng Taraf: Kelajakdagi Ob-Havo Tahlili
              </h3>
            </div>
            <span className={`text-[11px] font-mono ${theme.textColor} uppercase tracking-wider`}>
              Kelgusi davr tahlili
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Necha kun, hafta, oy yoki yil keyingi kelajak ob-havosini tahlil qilmoqchisiz? Son va birlikni kiriting:
          </p>

          {/* Input Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mt-4">
            <div className="sm:col-span-6">
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Sonni kiriting</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={futureAmount}
                onChange={(e) => setFutureAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0f090d] border ${theme.borderColor} text-white font-mono text-sm focus:outline-none transition-colors`}
                placeholder="Masalan: 45"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Vaqt birligi</label>
              <select
                value={futureUnit}
                onChange={(e) => setFutureUnit(e.target.value as TimeUnit)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0f090d] border ${theme.borderColor} text-white text-sm focus:outline-none transition-colors`}
              >
                <option value="kun">Kun (Kun keyin)</option>
                <option value="hafta">Hafta (Hafta keyin)</option>
                <option value="oy">Oy (Oy keyin)</option>
                <option value="yil">Yil (Yil keyin)</option>
              </select>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className={`text-[11px] ${theme.textColor} font-medium`}>Tezkor:</span>
            {[
              { val: 3, unit: 'kun', label: '3 kun' },
              { val: 14, unit: 'kun', label: '14 kun' },
              { val: 2, unit: 'oy', label: '2 oy (>1 oy)' },
              { val: 6, unit: 'oy', label: '6 oy' },
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFutureAmount(p.val);
                  setFutureUnit(p.unit as TimeUnit);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] ${theme.buttonPreset} transition-all`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* REAL-TIME PREVIEW WARNING IF > 1 MONTH */}
          {isFutureExceedingMonth && (
            <div className={`mt-3.5 p-3 rounded-xl ${theme.badgeBg} border ${theme.borderColor} flex items-start gap-2.5 animate-fadeIn`}>
              <AlertTriangle className={`w-5 h-5 ${theme.textColor} shrink-0 mt-0.5`} />
              <div className={`text-xs ${theme.textLight} leading-relaxed`}>
                <span className={`font-semibold ${theme.textHighlight} block mb-0.5`}>
                  Diqqat: 1 oydan ortiq muddat tanlandi!
                </span>
                Bu judaxam ko'p vaqt, sayt tahlil qilishdan adashishi mumkun! Ob-havoni 100% tahlil qilib bo'lmaydi, chunki atmosfera doimiy o'zgaruvchandir. Natija orbital iqlim modeli bo'yicha ko'rsatiladi.
              </div>
            </div>
          )}

          {/* Analyze Future Button */}
          <button
            onClick={handleFutureAnalyze}
            disabled={isFutureLoading}
            className={`w-full mt-4 py-2.5 px-4 rounded-xl font-medium text-sm ${theme.buttonPrimary} flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isFutureLoading ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isFutureLoading ? 'Kelajak ob-havosi tahlil qilinmoqda...' : 'Kelajak Ob-Havosini Tahlil Qilish'}</span>
          </button>

          {/* Future Result Display */}
          {futureResult && (
            <div className={`mt-5 p-4 rounded-xl bg-[#0d070a] border ${theme.borderColor} flex flex-col gap-3`}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Tahlil qilingan kelajak sana:{' '}
                  <b className={theme.textHighlight}>
                    {new Date(futureResult.targetDate + 'T00:00:00').toLocaleDateString('uz-UZ', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </b>
                </span>
                <span className={`font-mono text-[11px] ${theme.textColor}`}>+{futureResult.daysAhead} kun keyin</span>
              </div>

              {/* Strict warning display if > 1 month requested */}
              {futureResult.isLongTermWarning && futureResult.warningMessage && (
                <div className={`p-3 rounded-lg ${theme.badgeBg} border ${theme.borderStrong} text-xs ${theme.textLight} leading-relaxed font-medium`}>
                  {futureResult.warningMessage}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {futureResult.temp}°C
                  </div>
                  <div className={`text-xs ${theme.textLight} mt-0.5`}>
                    {futureResult.conditionText} · Kutilayotgan fasl: <b className={`capitalize ${theme.textHighlight}`}>{futureResult.projectedSeason}</b>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-medium text-slate-300">
                    Aniqlik darajasi: <b className={theme.textHighlight}>{futureResult.confidenceScore}%</b>
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${
                    futureResult.tempDiff >= 0 ? 'text-amber-400' : 'text-sky-400'
                  }`}>
                    Farq: {futureResult.tempDiff >= 0 ? `+${futureResult.tempDiff}°C` : `${futureResult.tempDiff}°C`}
                  </div>
                </div>
              </div>

              <p className={`text-[11px] leading-relaxed text-slate-400 italic ${theme.badgeBg} p-2.5 rounded-lg border ${theme.borderSubtle}`}>
                {futureResult.climateInsight}
              </p>

              {/* Apply to Globe Button */}
              <button
                onClick={() => {
                  const simulatedOffset = Math.round(futureResult.temp - currentWeather.current.temp);
                  onApplySimulationToGlobe(
                    futureResult.projectedSeason,
                    simulatedOffset,
                    `${futureResult.timeUnitDesc} keyingi ob-havo tahlili (${futureResult.temp}°C · ${futureResult.projectedSeason})`
                  );
                }}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold ${theme.buttonSecondary} transition-all flex items-center justify-center gap-1.5 shadow-md`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${theme.textColor}`} />
                <span>🌐 Globusda ushbu kelajak ob-havo tahlilini aks ettirish</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
