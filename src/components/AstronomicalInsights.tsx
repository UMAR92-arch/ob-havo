import React, { useMemo } from 'react';
import { WeatherData, CityLocation, Season } from '../types';
import { getSeasonTheme } from '../utils/seasonTheme';
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Compass,
  Clock,
  Sparkles,
  Camera,
  Eye,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface AstronomicalInsightsProps {
  weather: WeatherData;
  location: CityLocation;
  season?: Season;
}

// Calculate Astronomical & Solar Metrics
function calculateAstronomicalData(weather: WeatherData, location: CityLocation) {
  const sunriseStr = weather.current.sunrise || '06:15';
  const sunsetStr = weather.current.sunset || '18:45';

  const [srH, srM] = sunriseStr.split(':').map(Number);
  const [ssH, ssM] = sunsetStr.split(':').map(Number);

  const sunriseMinutes = srH * 60 + srM;
  const sunsetMinutes = ssH * 60 + ssM;

  // Day length in minutes
  let dayLengthMinutes = sunsetMinutes - sunriseMinutes;
  if (dayLengthMinutes < 0) dayLengthMinutes += 1440;

  const dayLengthHours = Math.floor(dayLengthMinutes / 60);
  const dayLengthRemainingMins = dayLengthMinutes % 60;

  const nightLengthMinutes = 1440 - dayLengthMinutes;
  const nightLengthHours = Math.floor(nightLengthMinutes / 60);
  const nightLengthRemainingMins = nightLengthMinutes % 60;

  // Solar Noon (Zenit)
  const solarNoonMinutes = Math.floor((sunriseMinutes + sunsetMinutes) / 2);
  const noonH = Math.floor(solarNoonMinutes / 60);
  const noonM = solarNoonMinutes % 60;
  const solarNoonStr = `${String(noonH).padStart(2, '0')}:${String(noonM).padStart(2, '0')}`;

  // Civil Dawn (Tong g'irasi) & Dusk (Shom)
  const dawnMinutes = Math.max(0, sunriseMinutes - 30);
  const dawnH = Math.floor(dawnMinutes / 60);
  const dawnM = dawnMinutes % 60;
  const dawnStr = `${String(dawnH).padStart(2, '0')}:${String(dawnM).padStart(2, '0')}`;

  const duskMinutes = Math.min(1439, sunsetMinutes + 30);
  const duskH = Math.floor(duskMinutes / 60);
  const duskM = duskMinutes % 60;
  const duskStr = `${String(duskH).padStart(2, '0')}:${String(duskM).padStart(2, '0')}`;

  // Golden hours (morning: sunrise to +45 min, evening: -45 min to sunset)
  const morningGoldenEnd = `${String(Math.floor((sunriseMinutes + 45) / 60)).padStart(2, '0')}:${String((sunriseMinutes + 45) % 60).padStart(2, '0')}`;
  const eveningGoldenStart = `${String(Math.floor((sunsetMinutes - 45) / 60)).padStart(2, '0')}:${String((sunsetMinutes - 45) % 60).padStart(2, '0')}`;

  // Current time in location minutes
  const [curH, curM] = weather.localTime.timeString.split(':').map(Number);
  const currentMinutes = curH * 60 + curM;

  // Sun elevation / progress along trajectory
  let sunProgress = 0; // 0 to 1 during daytime
  const isDay = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;

  if (isDay && dayLengthMinutes > 0) {
    sunProgress = (currentMinutes - sunriseMinutes) / dayLengthMinutes;
  }

  // Solar elevation angle approximation (in degrees)
  // Max elevation at noon depends on latitude and declination
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(Date.UTC(now.getFullYear(), 0, 0)).getTime()) / 86400000);
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  const maxNoonElevation = Math.max(5, 90 - Math.abs(location.lat - declination));

  let solarElevation = -20;
  if (isDay) {
    // Sinusoidal curve between 0 at sunrise/sunset and maxNoonElevation at noon
    solarElevation = Math.round(Math.sin(sunProgress * Math.PI) * maxNoonElevation);
  } else {
    // Night dip
    const nightProgress = currentMinutes > sunsetMinutes
      ? (currentMinutes - sunsetMinutes) / nightLengthMinutes
      : (currentMinutes + 1440 - sunsetMinutes) / nightLengthMinutes;
    solarElevation = -Math.round(Math.sin(nightProgress * Math.PI) * 35);
  }

  // Day length change trend (in October in Northern hemisphere, days shorten ~2.5 min/day)
  const isNorthern = location.lat >= 0;
  const month = now.getMonth(); // 0 to 11
  let dayChangeRate = 0;
  if (month >= 8 && month <= 11) {
    // Autumn: shortening in North, lengthening in South
    dayChangeRate = isNorthern ? -2.6 : +2.6;
  } else if (month >= 2 && month <= 5) {
    // Spring: lengthening in North, shortening in South
    dayChangeRate = isNorthern ? +2.7 : -2.7;
  } else {
    // Solstices
    dayChangeRate = isNorthern ? -0.8 : +0.8;
  }

  // Approximate Moon phase
  // Known reference new moon: Jan 11, 2024
  const refNewMoon = new Date(Date.UTC(2024, 0, 11, 11, 57)).getTime();
  const synodicMonth = 29.53058867 * 86400000;
  const phaseCycle = ((now.getTime() - refNewMoon) % synodicMonth) / synodicMonth;
  const moonAgeDays = Math.round(phaseCycle * 29.53);
  const moonIllumination = Math.round((0.5 - 0.5 * Math.cos(phaseCycle * 2 * Math.PI)) * 100);

  let moonPhaseName = 'Hilol';
  if (phaseCycle < 0.05 || phaseCycle > 0.95) moonPhaseName = 'Yangi Oy (New Moon)';
  else if (phaseCycle < 0.22) moonPhaseName = "O'suvchi Hilol (Waxing Crescent)";
  else if (phaseCycle < 0.28) moonPhaseName = 'Birinchi Chorak (First Quarter)';
  else if (phaseCycle < 0.45) moonPhaseName = "O'suvchi Bukrilgan Oy (Waxing Gibbous)";
  else if (phaseCycle < 0.55) moonPhaseName = "To'lin Oy (Full Moon)";
  else if (phaseCycle < 0.72) moonPhaseName = 'Kamayuvchi Bukrilgan Oy (Waning Gibbous)';
  else if (phaseCycle < 0.78) moonPhaseName = 'Oxirgi Chorak (Last Quarter)';
  else moonPhaseName = 'Kamayuvchi Hilol (Waning Crescent)';

  return {
    sunriseStr,
    sunsetStr,
    solarNoonStr,
    dawnStr,
    duskStr,
    dayLengthHours,
    dayLengthRemainingMins,
    nightLengthHours,
    nightLengthRemainingMins,
    dayChangeRate,
    isDay,
    sunProgress,
    solarElevation,
    morningGoldenEnd,
    eveningGoldenStart,
    moonPhaseName,
    moonAgeDays,
    moonIllumination,
  };
}

export const AstronomicalInsights: React.FC<AstronomicalInsightsProps> = ({ weather, location, season = 'kuz' }) => {
  const theme = getSeasonTheme(season);
  const astro = useMemo(() => {
    return calculateAstronomicalData(weather, location);
  }, [weather, location]);

  // SVG arc trajectory math
  // Arc from x=40, y=140 to x=360, y=140 with control point at x=200, y=20
  const arcStartX = 40;
  const arcEndX = 360;
  const arcY = 135;
  const peakY = 25;

  // Calculate current sun position on quadratic bezier curve
  // B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
  const t = Math.max(0, Math.min(1, astro.sunProgress));
  const sunX = (1 - t) ** 2 * arcStartX + 2 * (1 - t) * t * 200 + t ** 2 * arcEndX;
  const sunY = (1 - t) ** 2 * arcY + 2 * (1 - t) * t * peakY + t ** 2 * arcY;

  return (
    <div className={`w-full rounded-2xl bg-[#0d101a]/95 border ${theme.borderColor} p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-500`}>
      {/* Decorative starry aura */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${theme.badgeBg} border ${theme.borderColor} ${theme.textColor}`}>
            <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: '40s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Astronomik Ma'lumotlar & Quyosh Trayektoriyasi
              </h3>
              <span className={`px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.textHighlight} text-[10px] font-mono border ${theme.borderColor}`}>
                Jonli Hisob-kitob
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              <b className={theme.textHighlight}>{location.nameUz || location.name}</b> uchun kun uzunligi, Quyosh zeniti, oltin soatlar va Oy fazasi
            </p>
          </div>
        </div>

        {/* Current Solar Altitude Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#070b13] border border-white/10 text-xs">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">
            Quyosh balandligi:{' '}
            <b className={`font-mono ${astro.solarElevation > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
              {astro.solarElevation > 0 ? `+${astro.solarElevation}°` : `${astro.solarElevation}°`}
            </b>
          </span>
        </div>
      </div>

      {/* Main Grid: Visual Arc Trajectory & Solar Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center">
        {/* Visual Sky Trajectory Arc (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl bg-[#080b12] border border-white/5 flex flex-col items-center justify-center relative">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-1 px-2">
            <span>Ufq (Chiqish)</span>
            <span className="text-amber-300 font-semibold">Quyosh Zeniti ({astro.solarNoonStr})</span>
            <span>Ufq (Botish)</span>
          </div>

          {/* Trajectory SVG */}
          <div className="w-full max-w-[420px] aspect-[400/160] relative">
            <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="arcGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
                </linearGradient>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* Ground Horizon line */}
              <line x1="20" y1="135" x2="380" y2="135" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Daytime Arc Path */}
              <path
                d="M 40 135 Q 200 25, 360 135"
                fill="none"
                stroke="url(#arcGlow)"
                strokeWidth="2.5"
              />

              {/* Sunrise & Sunset markers */}
              <circle cx="40" cy="135" r="4.5" fill="#f59e0b" />
              <circle cx="360" cy="135" r="4.5" fill="#f43f5e" />

              {/* Current Sun Position (if daytime) */}
              {astro.isDay ? (
                <g>
                  {/* Glowing halo */}
                  <circle cx={sunX} cy={sunY} r="16" fill="url(#sunGlow)" opacity="0.6" className="animate-pulse" />
                  <circle cx={sunX} cy={sunY} r="7" fill="#ffffff" />
                </g>
              ) : (
                /* Moon indicator during night */
                <g transform="translate(200, 142)">
                  <circle cx="0" cy="0" r="10" fill="#38bdf8" opacity="0.3" />
                  <circle cx="0" cy="0" r="5" fill="#e2e8f0" />
                </g>
              )}
            </svg>
          </div>

          {/* Time markers beneath the trajectory */}
          <div className="w-full flex items-center justify-between text-xs font-mono pt-1 border-t border-white/5 px-2">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Sunrise className="w-3.5 h-3.5" />
              <span>{astro.sunriseStr}</span>
            </div>

            <div className="text-[11px] text-slate-400">
              {astro.isDay ? (
                <span className="text-emerald-400 font-sans font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Kunduzi · Osmondagi joriy o'rni
                </span>
              ) : (
                <span className="text-sky-300 font-sans font-medium flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5" />
                  Tungi vaqt · Quyosh ufq ostida
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-rose-300">
              <Sunset className="w-3.5 h-3.5" />
              <span>{astro.sunsetStr}</span>
            </div>
          </div>
        </div>

        {/* Day Length & Solar Metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Day Length Card */}
          <div className="p-4 rounded-xl bg-[#090d16] border border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Kun Uzunligi
              </span>
              <span className="text-xs font-medium text-slate-400">
                Tun: {astro.nightLengthHours}s {astro.nightLengthRemainingMins}d
              </span>
            </div>

            <div className="my-2.5">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                {astro.dayLengthHours} <span className="text-sm font-normal text-slate-400">soat</span>{' '}
                {astro.dayLengthRemainingMins} <span className="text-sm font-normal text-slate-400">daqiqa</span>
              </div>

              {/* Day / Night progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden flex">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${Math.round(((astro.dayLengthHours * 60 + astro.dayLengthRemainingMins) / 1440) * 100)}%` }}
                  title="Kunduzgi ulush"
                />
                <div
                  className="bg-sky-600 h-full flex-1"
                  title="Tungi ulush"
                />
              </div>
            </div>

            <div className="text-[11px] flex items-center gap-1.5 pt-1 text-slate-300">
              {astro.dayChangeRate < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Kunlar har kuni <b className="text-rose-300">{Math.abs(astro.dayChangeRate)} daqiqaga qisqarmoqda</b> (Kuz)</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Kunlar har kuni <b className="text-emerald-300">{astro.dayChangeRate} daqiqaga uzaymoqda</b> (Bahor)</span>
                </>
              )}
            </div>
          </div>

          {/* Golden Hour & Photography Card */}
          <div className="p-3.5 rounded-xl bg-[#090d16] border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">Oltin Soat (Golden Hour)</span>
                <span className="text-[11px] text-slate-400">Fotografiya uchun eng yumshoq yorug'lik</span>
              </div>
            </div>

            <div className="text-right font-mono text-[11px]">
              <div className="text-amber-300">Ertalab: {astro.sunriseStr} - {astro.morningGoldenEnd}</div>
              <div className="text-rose-300">Kechki: {astro.eveningGoldenStart} - {astro.sunsetStr}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Bottom Micro Cards: Dawn, Solar Noon, Dusk, Moon Phase */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-[#070a13] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Tong G'irasi (Civil Dawn)</span>
          <div className="text-lg font-bold font-mono text-sky-200 mt-1">
            {astro.dawnStr}
          </div>
          <span className="text-[10px] text-slate-500">Quyosh chiqishidan 30 daqiqa oldin</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#070a13] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Quyosh Zeniti (Solar Noon)</span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-1">
            {astro.solarNoonStr}
          </div>
          <span className="text-[10px] text-slate-500">Quyosh eng yuqori nuqtada</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#070a13] border border-white/5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Shom (Civil Dusk)</span>
          <div className="text-lg font-bold font-mono text-rose-300 mt-1">
            {astro.duskStr}
          </div>
          <span className="text-[10px] text-slate-500">Qorong'ulik to'liq tushishi</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#070a13] border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Oy Fazasi</span>
            <Moon className="w-3.5 h-3.5 text-sky-300" />
          </div>
          <div className="text-sm font-bold text-white mt-1 truncate" title={astro.moonPhaseName}>
            {astro.moonPhaseName}
          </div>
          <span className="text-[10px] text-sky-300 font-mono">
            {astro.moonIllumination}% yoritilgan · {astro.moonAgeDays}-kun
          </span>
        </div>
      </div>
    </div>
  );
};
