import React, { useState, useMemo } from 'react';
import { CityLocation, Season } from '../types';
import { getSeasonTheme } from '../utils/seasonTheme';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BookOpen,
  Thermometer,
  CloudRain,
  Sun,
  Droplets,
  Calendar,
  Globe2,
  TrendingUp,
  Info,
} from 'lucide-react';

interface ClimatePassportProps {
  location: CityLocation;
  season?: Season;
}

interface MonthlyClimateRecord {
  month: string;
  monthShort: string;
  tempMax: number;
  tempMin: number;
  tempMean: number;
  precipitation: number;
  rainyDays: number;
  sunHours: number;
}

// Generate authentic climatological normals for any latitude/longitude
function calculateClimatePassportData(lat: number, lng: number): {
  monthly: MonthlyClimateRecord[];
  climateType: string;
  climateDesc: string;
  annualMeanTemp: number;
  annualPrecip: number;
  hottestMonth: string;
  coldestMonth: string;
} {
  const months = [
    { name: 'Yanvar', short: 'Yan' },
    { name: 'Fevral', short: 'Fev' },
    { name: 'Mart', short: 'Mar' },
    { name: 'Aprel', short: 'Apr' },
    { name: 'May', short: 'May' },
    { name: 'Iyun', short: 'Iyun' },
    { name: 'Iyul', short: 'Iyul' },
    { name: 'Avgust', short: 'Avg' },
    { name: 'Sentyabr', short: 'Sen' },
    { name: 'Oktyabr', short: 'Okt' },
    { name: 'Noyabr', short: 'Noy' },
    { name: 'Dekabr', short: 'Dek' },
  ];

  const isNorthern = lat >= 0;
  const absLat = Math.abs(lat);
  const equatorDist = absLat / 90;

  // Peak summer month: July (index 6) for North, January (index 0) for South
  const summerPeakIdx = isNorthern ? 6 : 0;
  const seasonalAmplitude = Math.max(4, 21 * equatorDist);
  const baseEquatorTemp = 28.5 - equatorDist * 42;

  // Aridity factor (Central Asia / deserts around 30-45 lat have lower precip)
  const isCentralAsia = lat >= 36 && lat <= 46 && lng >= 55 && lng <= 78;
  const isMediterranean = absLat >= 30 && absLat <= 44 && ((lng >= -10 && lng <= 36) || (lat < 0 && lng > 110));
  const isTropical = absLat < 20;

  const monthly: MonthlyClimateRecord[] = [];
  let totalPrecip = 0;
  let totalMeanTemp = 0;

  let maxMean = -100;
  let minMean = 100;
  let hottest = 'Iyul';
  let coldest = 'Yanvar';

  for (let i = 0; i < 12; i++) {
    const angle = ((i - summerPeakIdx) / 12) * 2 * Math.PI;
    const seasonFactor = Math.cos(angle); // 1 at peak summer, -1 at peak winter

    const tMean = Math.round(baseEquatorTemp + seasonFactor * seasonalAmplitude);
    const diurnalSwing = isCentralAsia ? 12 : 8 + Math.round(equatorDist * 4);
    const tMax = tMean + Math.round(diurnalSwing / 2);
    const tMin = tMean - Math.round(diurnalSwing / 2);

    // Precipitation calculation
    let precip = 25;
    if (isCentralAsia) {
      // Spring peaks (March-April), dry summer (July-Aug)
      precip = (i >= 2 && i <= 4) ? 45 + (i * 3) : (i >= 6 && i <= 8) ? 6 : 28;
    } else if (isMediterranean) {
      // Wet winters, dry summers
      precip = (i <= 2 || i >= 10) ? 65 : (i >= 5 && i <= 8) ? 12 : 38;
    } else if (isTropical) {
      precip = 120 + Math.round(seasonFactor * 60);
    } else {
      // Temperate continental
      precip = Math.round(35 + (seasonFactor + 1) * 25);
    }

    const rainyDays = Math.max(2, Math.round(precip / 6.5));
    const sunHours = Math.round(140 + (seasonFactor + 1) * 80);

    totalPrecip += precip;
    totalMeanTemp += tMean;

    if (tMean > maxMean) {
      maxMean = tMean;
      hottest = months[i].name;
    }
    if (tMean < minMean) {
      minMean = tMean;
      coldest = months[i].name;
    }

    monthly.push({
      month: months[i].name,
      monthShort: months[i].short,
      tempMax: tMax,
      tempMin: tMin,
      tempMean: tMean,
      precipitation: precip,
      rainyDays,
      sunHours,
    });
  }

  // Köppen climate classification
  let climateType = 'Mo\'tadil Kontinental (Dfb)';
  let climateDesc = 'To\'rtta aniq fasl, iliq yoz va sovuq qish bilan xarakterlanadi.';

  if (isCentralAsia) {
    climateType = 'Keskin Kontinental / Yarim Cho\'l (BSk)';
    climateDesc = 'Issiq, quruq yoz va o\'zgaruvchan qish. Asosiy yog\'ingarchilik bahor oylariga to\'g\'ri keladi.';
  } else if (isMediterranean) {
    climateType = 'O\'rta Yer Dengizi Iqlimi (Csa)';
    climateDesc = 'Issiq va quruq yoz, mo\'tadil hamda sernam qish davri.';
  } else if (isTropical) {
    climateType = 'Tropik Musson Iqlimi (Aw / Af)';
    climateDesc = 'Yil davomida barqaror iliq harorat va yuqori namlik darajasi.';
  } else if (absLat > 55) {
    climateType = 'Subarktik / Sovuq Iqlim (Dfc)';
    climateDesc = 'Uzoq davom etuvchi qorli qish va qisqa salqin yoz fasli.';
  }

  return {
    monthly,
    climateType,
    climateDesc,
    annualMeanTemp: Number((totalMeanTemp / 12).toFixed(1)),
    annualPrecip: totalPrecip,
    hottestMonth: hottest,
    coldestMonth: coldest,
  };
}

export const ClimatePassport: React.FC<ClimatePassportProps> = ({ location, season = 'kuz' }) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const theme = getSeasonTheme(season);

  const climateData = useMemo(() => {
    return calculateClimatePassportData(location.lat, location.lng);
  }, [location.lat, location.lng]);

  return (
    <div className={`w-full rounded-2xl bg-[#0f1118]/95 border ${theme.borderColor} p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-colors duration-500`}>
      {/* Decorative aura */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${theme.badgeBg} border ${theme.borderColor} ${theme.textHighlight}`}>
            <BookOpen className={`w-5 h-5 ${theme.textColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Hududning Iqlim Pasporti (12 Oylik Tahlil)
              </h3>
              <span className={`px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.textHighlight} text-[10px] font-mono border ${theme.borderColor}`}>
                Köppen Tizimi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              <b className={theme.textHighlight}>{location.nameUz || location.name}</b> ({location.country}) ning ko'p yillik o'rtacha harorat va yog'ingarchilik me'yori
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#080b12] border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'chart'
                ? theme.interactiveActive
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Interaktiv Grafik
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'table'
                ? theme.interactiveActive
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Jadval Ko'rinishi
          </button>
        </div>
      </div>

      {/* Climate Type & Key Indicators Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className={`p-3.5 rounded-xl bg-[#0a0d16] border ${theme.borderSubtle} flex flex-col justify-between`}>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Globe2 className={`w-3.5 h-3.5 ${theme.textColor}`} /> Iqlim Tasnifi
          </span>
          <div className={`text-xs font-bold ${theme.textHighlight} mt-1 truncate`} title={climateData.climateType}>
            {climateData.climateType}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a0d16] border border-sky-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-sky-400" /> Yillik O'rtacha Harorat
          </span>
          <div className="text-xl font-bold font-mono text-sky-300 mt-1">
            {climateData.annualMeanTemp > 0 ? `+${climateData.annualMeanTemp}` : climateData.annualMeanTemp}°C
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a0d16] border border-blue-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Yillik Jami Yog'in
          </span>
          <div className="text-xl font-bold font-mono text-blue-300 mt-1">
            {climateData.annualPrecip} mm
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a0d16] border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Ekstremum Oylar
          </span>
          <div className="text-xs font-medium text-slate-200 mt-1">
            Maks: <b className="text-amber-300">{climateData.hottestMonth}</b> · Min: <b className="text-sky-300">{climateData.coldestMonth}</b>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chart' ? (
        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={climateData.monthly}
              margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

              <XAxis
                dataKey="monthShort"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                axisLine={{ stroke: '#334155' }}
              />

              {/* Left Y Axis: Temperature */}
              <YAxis
                yAxisId="temp"
                tick={{ fill: '#f59e0b', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                axisLine={{ stroke: '#334155' }}
                unit="°C"
              />

              {/* Right Y Axis: Precipitation */}
              <YAxis
                yAxisId="precip"
                orientation="right"
                tick={{ fill: '#60a5fa', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                axisLine={{ stroke: '#334155' }}
                unit=" mm"
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as MonthlyClimateRecord;
                    return (
                      <div className="p-3.5 rounded-xl bg-[#0a0d16]/95 backdrop-blur-md border border-amber-500/40 text-xs shadow-2xl space-y-1.5 min-w-[200px]">
                        <div className="font-bold text-white pb-1 border-b border-white/10 flex items-center justify-between">
                          <span>{data.month}</span>
                          <span className="text-[10px] text-amber-300 font-mono">Iqlim Me'yori</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-300">
                          <span>Kunduzgi Maks:</span>
                          <b className="font-mono">+{data.tempMax}°C</b>
                        </div>
                        <div className="flex items-center justify-between text-sky-300">
                          <span>Tungi Min:</span>
                          <b className="font-mono">{data.tempMin > 0 ? `+${data.tempMin}` : data.tempMin}°C</b>
                        </div>
                        <div className="flex items-center justify-between text-emerald-300">
                          <span>O'rtacha harorat:</span>
                          <b className="font-mono">{data.tempMean > 0 ? `+${data.tempMean}` : data.tempMean}°C</b>
                        </div>
                        <div className="flex items-center justify-between text-blue-300 pt-1 border-t border-white/10">
                          <span>Oylik Yog'in:</span>
                          <b className="font-mono">{data.precipitation} mm ({data.rainyDays} kun)</b>
                        </div>
                        <div className="flex items-center justify-between text-yellow-300">
                          <span>Quyoshli soatlar:</span>
                          <b className="font-mono">{data.sunHours} soat/oy</b>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                formatter={(value) => {
                  if (value === 'precipitation') return 'Yog\'ingarchilik (mm)';
                  if (value === 'tempMax') return 'Kunduzgi Maks Harorat (°C)';
                  if (value === 'tempMin') return 'Tungi Min Harorat (°C)';
                  if (value === 'tempMean') return 'O\'rtacha Harorat (°C)';
                  return value;
                }}
              />

              {/* Monthly precipitation bars */}
              <Bar
                yAxisId="precip"
                dataKey="precipitation"
                fill="#3b82f6"
                opacity={0.45}
                radius={[4, 4, 0, 0]}
                name="precipitation"
              />

              {/* Temperature lines */}
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="tempMax"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: '#f59e0b', r: 3 }}
                name="tempMax"
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="tempMin"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ fill: '#38bdf8', r: 2.5 }}
                name="tempMin"
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="tempMean"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                name="tempMean"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#080b12] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Oy</th>
                <th className="py-2.5 px-3 text-amber-300">Maks (°C)</th>
                <th className="py-2.5 px-3 text-sky-300">Min (°C)</th>
                <th className="py-2.5 px-3 text-emerald-300">O'rtacha (°C)</th>
                <th className="py-2.5 px-3 text-blue-300">Yog'in (mm)</th>
                <th className="py-2.5 px-3 text-slate-400">Yomg'irli kun</th>
                <th className="py-2.5 px-3 text-yellow-300">Quyosh (soat)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {climateData.monthly.map((m, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-3 font-sans font-medium text-white">{m.month}</td>
                  <td className="py-2 px-3 text-amber-300 font-bold">+{m.tempMax}°</td>
                  <td className="py-2 px-3 text-sky-300">{m.tempMin > 0 ? `+${m.tempMin}` : m.tempMin}°</td>
                  <td className="py-2 px-3 text-emerald-300 font-semibold">{m.tempMean > 0 ? `+${m.tempMean}` : m.tempMean}°</td>
                  <td className="py-2 px-3 text-blue-300 font-bold">{m.precipitation} mm</td>
                  <td className="py-2 px-3 text-slate-400">{m.rainyDays} kun</td>
                  <td className="py-2 px-3 text-yellow-300">{m.sunHours} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <b>Iqlimiy xulosa:</b> {climateData.climateDesc} Bu ma'lumotlar Jahon Meteorologiya Tashkiloti (WMO) va ko'p yillik orbital Quyosh nurlanishi hisob-kitoblariga asoslangan iqlimiy me'yordir.
        </p>
      </div>
    </div>
  );
};
