import React, { useState } from 'react';
import { WeatherData, Season } from '../types';
import { useLiveClock } from '../hooks/useLiveClock';
import { getSeasonTheme } from '../utils/seasonTheme';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Compass,
  Gauge,
  Sun,
  Sunrise,
  Sunset,
  CloudRain,
  Cloud,
  MapPin,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
} from 'lucide-react';

interface WeatherDashboardProps {
  weather: WeatherData;
  isLoading?: boolean;
  season?: Season;
}

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({ weather, isLoading, season = 'kuz' }) => {
  const theme = getSeasonTheme(season);
  // 1. Ticking Live Real-time Clock (Ticks every second without page refresh!)
  const { timeString: liveTimeString, dateString: liveDateString, dayOfWeek: liveDayOfWeek } = useLiveClock(weather.location.timezone);

  // UV index category
  const getUvLevel = (uv: number) => {
    if (uv <= 2) return { text: 'Past', color: 'text-emerald-400' };
    if (uv <= 5) return { text: 'O\'rtacha', color: 'text-amber-400' };
    if (uv <= 7) return { text: 'Yuqori', color: 'text-orange-400' };
    if (uv <= 10) return { text: 'Juda yuqori', color: 'text-rose-400' };
    return { text: 'Ekstremal', color: 'text-purple-400' };
  };

  const uvInfo = getUvLevel(weather.current.uvIndex);

  // Hourly chart data (next 16 hours)
  const hourlyData = weather.hourly.slice(0, 16);
  const temps = hourlyData.map((h) => h.temp);
  const minTemp = Math.min(...temps, 0);
  const maxTemp = Math.max(...temps, 30);
  const range = Math.max(1, maxTemp - minTemp);

  // Recharts Historical Weather Trend (Past Month) calculations
  const historyData = weather.monthlyHistory || [];
  const maxRecorded = historyData.length > 0 ? Math.max(...historyData.map((d) => d.tempMax)) : weather.current.temp;
  const minRecorded = historyData.length > 0 ? Math.min(...historyData.map((d) => d.tempMin)) : weather.current.temp;
  const avgRecorded = historyData.length > 0
    ? Math.round(historyData.reduce((acc, d) => acc + d.tempMean, 0) / historyData.length)
    : weather.current.temp;

  const [historyMetric, setHistoryMetric] = useState<'temps' | 'mean' | 'precipitation'>('temps');

  return (
    <div className={`space-y-6 ${isLoading ? 'opacity-70 pointer-events-none transition-opacity' : ''}`}>
      {/* Top Banner: Live World Clock & Real Weather Hero */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Live World Clock Card */}
        <div className="md:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#10141f] via-[#0d1018] to-[#080b11] border border-sky-900/40 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '60s' }} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                  Haqiqiy Real-Vaqt Soati
                </span>
                <h3 className="text-sm font-semibold text-slate-200">
                  {weather.location.nameUz || weather.location.name}
                </h3>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-600/40 text-xs font-mono font-semibold text-sky-300">
              {weather.localTime.utcOffset}
            </div>
          </div>

          <div className="my-5">
            {/* Ticking Digital Time Display */}
            <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-white flex items-baseline gap-1">
              <span>{liveTimeString}</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1.5 flex items-center gap-2">
              <span className="text-amber-300 font-semibold">{liveDayOfWeek}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">{liveDateString}</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400/90 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Har soniyada real vaqt yangilanadi (F5 shart emas)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sunrise className="w-4 h-4 text-amber-400" />
              <span>Quyosh chiqishi: <b className="text-white font-mono">{weather.current.sunrise}</b></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Sunset className="w-4 h-4 text-rose-400" />
              <span>Quyosh botishi: <b className="text-white font-mono">{weather.current.sunset}</b></span>
            </div>
          </div>
        </div>

        {/* Current Real Weather Card */}
        <div className="md:col-span-7 p-6 rounded-2xl bg-gradient-to-br from-[#181410] via-[#14100c] to-[#0d0a08] border border-amber-900/40 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>{weather.location.country}</span>
                {weather.location.region && <span className="text-slate-500">· {weather.location.region}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
                {weather.location.nameUz || weather.location.name}
              </h1>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
              <span>{weather.current.conditionText}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4 my-4">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
                {weather.current.temp}°C
              </span>
              <div className="text-xs text-slate-400">
                <div>His etilishi: <span className="font-semibold text-slate-200">{weather.current.apparentTemp}°C</span></div>
                {weather.daily[0] && (
                  <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                    <span className="text-amber-400">↑ {weather.daily[0].tempMax}°</span>
                    <span className="text-sky-400">↓ {weather.daily[0].tempMin}°</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Namlik: <b className="text-white font-mono">{weather.current.humidity}%</b></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-emerald-400" />
                <span>Shamol: <b className="text-white font-mono">{weather.current.windSpeed} km/s</b></span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-amber-200/60 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Koordinata: {weather.location.lat.toFixed(2)}°, {weather.location.lng.toFixed(2)}°</span>
            <span className="font-mono">Open-Meteo Haqiqiy Global Sensorlar</span>
          </div>
        </div>
      </div>

      {/* ================= RECHARTS: HISTORICAL WEATHER TREND OVER PAST MONTH ================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1118]/95 border border-sky-900/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                O'tgan 1 Oylik Tarixiy Harorat Dinamikasi (Recharts)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              <b className="text-sky-300">{weather.location.nameUz || weather.location.name}</b> uchun so'nggi 30 kundagi real meteorologik stansiya qaydlari va tebranishlar grafigi.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#080b12] border border-white/5 self-start sm:self-auto">
            <button
              onClick={() => setHistoryMetric('temps')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                historyMetric === 'temps'
                  ? `${theme.interactiveActive} font-bold shadow-sm`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Maks & Min Harorat
            </button>
            <button
              onClick={() => setHistoryMetric('mean')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                historyMetric === 'mean'
                  ? `${theme.interactiveActive} font-bold shadow-sm`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              O'rtacha
            </button>
            <button
              onClick={() => setHistoryMetric('precipitation')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                historyMetric === 'precipitation'
                  ? `${theme.interactiveActive} font-bold shadow-sm`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yog'ingarchilik (mm)
            </button>
          </div>
        </div>

        {/* 1-Month Summary Stats Pills */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className={`p-3 rounded-xl bg-[#090d16] border ${theme.borderColor} flex flex-col justify-between`}>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <TrendingUp className={`w-3.5 h-3.5 ${theme.textColor}`} /> Eng issiq kun
            </span>
            <div className={`text-xl sm:text-2xl font-bold font-mono ${theme.textHighlight} mt-1`}>
              {maxRecorded}°C
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-sky-500/20 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-sky-400" /> Eng sovuq kun
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-300 mt-1">
              {minRecorded}°C
            </div>
          </div>

          <div className={`p-3 rounded-xl bg-[#090d16] border ${theme.borderSubtle} flex flex-col justify-between`}>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className={`w-3.5 h-3.5 ${theme.textColor}`} /> 1 oylik o'rtacha
            </span>
            <div className={`text-xl sm:text-2xl font-bold font-mono ${theme.textHighlight} mt-1`}>
              {avgRecorded}°C
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="w-full h-72 sm:h-80">
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMean" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={{ stroke: '#334155' }}
                  axisLine={{ stroke: '#334155' }}
                />

                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={{ stroke: '#334155' }}
                  axisLine={{ stroke: '#334155' }}
                  unit={historyMetric === 'precipitation' ? ' mm' : '°'}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-[#0b0e17]/95 backdrop-blur-md border border-sky-500/40 text-xs shadow-2xl">
                          <div className="font-semibold text-white mb-1.5 pb-1 border-b border-white/10 flex items-center justify-between gap-4">
                            <span>Sana: {data.date}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({data.displayDate})</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-amber-300 flex items-center justify-between gap-3">
                              <span>Maks harorat:</span>
                              <b className="font-mono">{data.tempMax}°C</b>
                            </div>
                            <div className="text-sky-300 flex items-center justify-between gap-3">
                              <span>Min harorat:</span>
                              <b className="font-mono">{data.tempMin}°C</b>
                            </div>
                            <div className="text-emerald-300 flex items-center justify-between gap-3">
                              <span>O'rtacha:</span>
                              <b className="font-mono">{data.tempMean}°C</b>
                            </div>
                            {data.precipitation > 0 && (
                              <div className="text-indigo-300 flex items-center justify-between gap-3 pt-1 border-t border-white/10">
                                <span>Yog'in miqdori:</span>
                                <b className="font-mono">{data.precipitation} mm</b>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => {
                    if (value === 'tempMax') return 'Maksimal harorat (°C)';
                    if (value === 'tempMin') return 'Minimal harorat (°C)';
                    if (value === 'tempMean') return 'O\'rtacha harorat (°C)';
                    if (value === 'precipitation') return 'Yog\'ingarchilik (mm)';
                    return value;
                  }}
                />

                {historyMetric === 'temps' && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="tempMax"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMax)"
                      name="tempMax"
                    />
                    <Area
                      type="monotone"
                      dataKey="tempMin"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMin)"
                      name="tempMin"
                    />
                  </>
                )}

                {historyMetric === 'mean' && (
                  <Area
                    type="monotone"
                    dataKey="tempMean"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMean)"
                    name="tempMean"
                  />
                )}

                {historyMetric === 'precipitation' && (
                  <Area
                    type="monotone"
                    dataKey="precipitation"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPrecip)"
                    name="precipitation"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              1 oylik ma'lumotlar yuklanmoqda...
            </div>
          )}
        </div>
      </div>

      {/* Weather Statistics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span>Haqiqiy Meteorologik Ko'rsatkichlar & Statistikalar</span>
          </h3>
          <span className="text-xs text-slate-400">Foizlar va raqamlar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Namlik */}
          <div className="p-4 rounded-xl bg-[#11141c]/90 border border-sky-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Namlik</span>
              <Droplets className="w-4 h-4 text-sky-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-white">
                {weather.current.humidity}<span className="text-base text-sky-300 font-sans">%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, weather.current.humidity)}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              {weather.current.humidity > 70 ? 'Yuqori namlik' : weather.current.humidity < 30 ? 'Quruq havo' : 'Qulay muhit'}
            </div>
          </div>

          {/* Yog'ingarchilik */}
          <div className="p-4 rounded-xl bg-[#14121a]/90 border border-indigo-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Yog'ingarchilik</span>
              <CloudRain className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-white">
                {weather.daily[0]?.precipitationProb ?? 0}<span className="text-base text-indigo-300 font-sans">%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, weather.daily[0]?.precipitationProb ?? 0)}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Miqdor: <b className="text-slate-200">{weather.current.precipitation} mm</b>
            </div>
          </div>

          {/* Shamol tezligi */}
          <div className="p-4 rounded-xl bg-[#0f1614]/90 border border-emerald-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Shamol</span>
              <Wind className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-white">
                {weather.current.windSpeed}
                <span className="text-xs text-emerald-300 font-sans ml-1">km/s</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                <Compass className="w-3.5 h-3.5 text-emerald-400" style={{ transform: `rotate(${weather.current.windDirection}deg)` }} />
                <span>{weather.current.windDirection}° yo'nalish</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Maks: {weather.daily[0]?.windSpeedMax ?? weather.current.windSpeed} km/s
            </div>
          </div>

          {/* UV Indeks */}
          <div className="p-4 rounded-xl bg-[#16120e]/90 border border-amber-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>UV Indeks</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1.5">
                <span>{weather.current.uvIndex}</span>
                <span className={`text-xs font-semibold ${uvInfo.color}`}>({uvInfo.text})</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (weather.current.uvIndex / 11) * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              {weather.current.uvIndex > 5 ? 'Quyosh ko\'zoynagi tavsiya' : 'Xavfsiz daraja'}
            </div>
          </div>

          {/* Bosim */}
          <div className="p-4 rounded-xl bg-[#131317]/90 border border-purple-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Bosim</span>
              <Gauge className="w-4 h-4 text-purple-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-white">
                {weather.current.pressure}
                <span className="text-xs text-purple-300 font-sans ml-1">hPa</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                ≈ {Math.round(weather.current.pressure * 0.75)} mm simob
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              {weather.current.pressure >= 1013 ? 'Normal/Barqaror' : 'Past bosim'}
            </div>
          </div>

          {/* Bulutlilik */}
          <div className="p-4 rounded-xl bg-[#111317]/90 border border-slate-700/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Bulutlilik</span>
              <Cloud className="w-4 h-4 text-slate-300" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-white">
                {weather.current.cloudCover}<span className="text-base text-slate-300 font-sans">%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-slate-300 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, weather.current.cloudCover)}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              {weather.current.cloudCover > 70 ? 'Qalin bulutli' : weather.current.cloudCover > 30 ? 'Qisman ochiq' : 'Musaffo osmon'}
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Timeline */}
      <div className="p-5 rounded-2xl bg-[#111218]/90 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-slate-200">
              24 Soatlik Harorat va Yog'in Ehtimoli Dinamikasi
            </h4>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Harorat (°C)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400/70" /> Yog'in (%)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          <div className="min-w-[680px] flex items-end justify-between gap-2 h-44 pt-6 px-2">
            {hourlyData.map((h, idx) => {
              const heightPct = Math.max(15, Math.min(85, ((h.temp - minTemp) / range) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <span className="text-xs font-mono font-semibold text-amber-300 mb-1 group-hover:scale-110 transition-transform">
                    {h.temp}°
                  </span>

                  <div className="w-full max-w-[28px] flex flex-col items-center justify-end h-24">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-amber-600/40 via-amber-500/60 to-amber-400 hover:from-amber-500 hover:to-amber-300 transition-all cursor-pointer relative"
                      style={{ height: `${heightPct}%` }}
                      title={`${h.time}: ${h.temp}°C, ${h.conditionText}`}
                    >
                      {h.precipitationProb > 0 && (
                        <div
                          className="absolute bottom-0 inset-x-0 bg-sky-400/80 rounded-t-sm"
                          style={{ height: `${Math.min(100, h.precipitationProb)}%` }}
                          title={`Yog'in ehtimoli: ${h.precipitationProb}%`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 mt-2 text-center">
                    {h.time}
                  </div>
                  {h.precipitationProb > 20 && (
                    <div className="text-[10px] font-mono text-sky-400 font-medium">
                      {h.precipitationProb}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Row */}
      <div className={`p-5 rounded-2xl bg-[#111218]/90 border ${theme.borderColor} shadow-xl`}>
        <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <span>📅 7 Kunlik Ob-Havo Tahlili (Real Vaqt)</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {weather.daily.map((day, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                idx === 0
                  ? `${theme.badgeBg} ${theme.borderColor} shadow-md`
                  : 'bg-[#0e1017] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${idx === 0 ? theme.textHighlight : 'text-slate-300'}`}>
                  {day.dayName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {day.date.slice(5)}
                </span>
              </div>

              <div className="my-2.5">
                <div className="text-xs text-slate-300 truncate font-medium">
                  {day.conditionText}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold font-mono text-white">
                    {day.tempMax}°
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {day.tempMin}°
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-white/5">
                <span className="flex items-center gap-1 text-sky-300">
                  <CloudRain className="w-3 h-3" />
                  <span>{day.precipitationProb}%</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {day.windSpeedMax} km/s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
