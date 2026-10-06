import { CityLocation, WeatherData, DailyForecast, HourlyForecast, HistoricalComparison, FutureForecastResult, Season, TimeUnit } from '../types';

export function getWeatherConditionUz(code: number): { text: string; icon: string; theme: string } {
  switch (code) {
    case 0:
      return { text: 'Musaffo osmon', icon: 'Sun', theme: 'clear' };
    case 1:
      return { text: 'Asosan ochiq', icon: 'SunDim', theme: 'clear' };
    case 2:
      return { text: 'Qisman bulutli', icon: 'CloudSun', theme: 'partly-cloudy' };
    case 3:
      return { text: 'Bulutli', icon: 'Cloud', theme: 'cloudy' };
    case 45:
    case 48:
      return { text: 'Tuman', icon: 'CloudFog', theme: 'fog' };
    case 51:
    case 53:
    case 55:
      return { text: 'Mayda yomg\'ir (shivalama)', icon: 'CloudDrizzle', theme: 'rain' };
    case 61:
      return { text: 'Yengil yomg\'ir', icon: 'CloudRain', theme: 'rain' };
    case 63:
      return { text: 'O\'rtacha yomg\'ir', icon: 'CloudRain', theme: 'rain' };
    case 65:
      return { text: 'Kuchli yomg\'ir', icon: 'CloudRainWind', theme: 'heavy-rain' };
    case 66:
    case 67:
      return { text: 'Muzli yomg\'ir', icon: 'CloudHail', theme: 'sleet' };
    case 71:
      return { text: 'Yengil qor', icon: 'CloudSnow', theme: 'snow' };
    case 73:
      return { text: 'O\'rtacha qor yog\'ishi', icon: 'Snowflake', theme: 'snow' };
    case 75:
      return { text: 'Qalin qor bo\'roni', icon: 'Snowflake', theme: 'heavy-snow' };
    case 77:
      return { text: 'Mayda qor donalari', icon: 'CloudSnow', theme: 'snow' };
    case 80:
    case 81:
    case 82:
      return { text: 'Jala yomg\'ir', icon: 'CloudRainWind', theme: 'heavy-rain' };
    case 85:
    case 86:
      return { text: 'Bo\'ronli qor', icon: 'Snowflake', theme: 'heavy-snow' };
    case 95:
      return { text: 'Momaqaldiroq', icon: 'CloudLightning', theme: 'storm' };
    case 96:
    case 99:
      return { text: 'Momaqaldiroqli do\'l', icon: 'CloudLightning', theme: 'storm' };
    default:
      return { text: 'O\'zgaruvchan havo', icon: 'CloudSun', theme: 'default' };
  }
}

export function getSeasonForLocation(lat: number, date: Date = new Date()): Season {
  const month = date.getMonth(); // 0 to 11
  const isNorthern = lat >= 0;

  if (month >= 2 && month <= 4) {
    // March, April, May
    return isNorthern ? 'bahor' : 'kuz';
  } else if (month >= 5 && month <= 7) {
    // June, July, August
    return isNorthern ? 'yoz' : 'qish';
  } else if (month >= 8 && month <= 10) {
    // September, October, November
    return isNorthern ? 'kuz' : 'bahor';
  } else {
    // December, January, February
    return isNorthern ? 'qish' : 'yoz';
  }
}

export function formatLocalTime(timezone: string, dateObj: Date = new Date()) {
  try {
    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    const timeString = new Intl.DateTimeFormat('uz-UZ', timeOptions).format(dateObj);

    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const dateString = new Intl.DateTimeFormat('uz-UZ', dateOptions).format(dateObj);

    const dayOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      weekday: 'long',
    };
    const rawDay = new Intl.DateTimeFormat('uz-UZ', dayOptions).format(dateObj);
    const dayOfWeek = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);

    // Calculate UTC offset
    const utcHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(dateObj);
    const localHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(dateObj);

    const [uH, uM] = utcHourStr.split(':').map(Number);
    const [lH, lM] = localHourStr.split(':').map(Number);
    let diffMinutes = (lH * 60 + lM) - (uH * 60 + uM);
    if (diffMinutes < -720) diffMinutes += 1440;
    if (diffMinutes > 720) diffMinutes -= 1440;
    const offsetHours = Math.floor(Math.abs(diffMinutes) / 60);
    const offsetMins = Math.abs(diffMinutes) % 60;
    const sign = diffMinutes >= 0 ? '+' : '-';
    const utcOffset = `UTC${sign}${offsetHours}${offsetMins > 0 ? `:${offsetMins}` : ''}`;

    const hour = parseInt(timeString.split(':')[0], 10);
    const isDaytime = hour >= 6 && hour < 19;

    return {
      timeString,
      dateString,
      dayOfWeek,
      utcOffset,
      isDaytime,
      rawDate: dateObj,
    };
  } catch {
    // Fallback
    return {
      timeString: new Date().toLocaleTimeString('uz-UZ'),
      dateString: new Date().toLocaleDateString('uz-UZ'),
      dayOfWeek: 'Bugun',
      utcOffset: 'UTC',
      isDaytime: true,
      rawDate: new Date(),
    };
  }
}

export async function fetchWeather(location: CityLocation): Promise<WeatherData> {
  // Query current, hourly, 7-day daily forecast, AND past 31 days historical observations in one call
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&past_days=31&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Ob-havo ma'lumotlarini yuklashda xatolik yuz berdi (${res.status})`);
  }

  const data = await res.json();
  const timezone = data.timezone || location.timezone || 'UTC';
  const localTime = formatLocalTime(timezone);

  const condition = getWeatherConditionUz(data.current.weather_code);

  // Parse Hourly Forecast (next 24 hours starting from current hour)
  const currentIsoHour = data.current.time.slice(0, 13);
  let startIndex = 0;
  if (data.hourly && data.hourly.time) {
    const foundIdx = data.hourly.time.findIndex((t: string) => t.startsWith(currentIsoHour));
    if (foundIdx !== -1) startIndex = foundIdx;
  }

  const hourly: HourlyForecast[] = [];
  if (data.hourly && data.hourly.time) {
    for (let i = startIndex; i < Math.min(startIndex + 24, data.hourly.time.length); i++) {
      const hCode = data.hourly.weather_code[i] ?? 0;
      hourly.push({
        time: data.hourly.time[i].slice(11, 16), // "14:00"
        temp: Math.round(data.hourly.temperature_2m[i]),
        apparentTemp: Math.round(data.hourly.apparent_temperature[i]),
        precipitationProb: data.hourly.precipitation_probability ? (data.hourly.precipitation_probability[i] ?? 0) : 0,
        weatherCode: hCode,
        conditionText: getWeatherConditionUz(hCode).text,
        isDay: Boolean(data.hourly.is_day[i]),
      });
    }
  }

  // Parse Daily Forecast (today and upcoming days)
  // Because past_days=31 was requested, the first 31 daily entries are past days, and entry 31 is today!
  const daily: DailyForecast[] = [];
  const daysMap = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const dailyTimes = data.daily?.time || [];
  const todayIso = data.current.time.slice(0, 10);
  let todayIndex = dailyTimes.findIndex((t: string) => t === todayIso);
  if (todayIndex === -1) todayIndex = Math.min(31, Math.max(0, dailyTimes.length - 7));

  // Extract next 7 days for the daily forecast cards
  for (let i = todayIndex; i < Math.min(todayIndex + 7, dailyTimes.length); i++) {
    const dCode = data.daily.weather_code[i] ?? 0;
    const dDate = new Date(dailyTimes[i]);
    const offsetDay = i - todayIndex;
    const dayName = offsetDay === 0 ? 'Bugun' : offsetDay === 1 ? 'Ertaga' : daysMap[dDate.getDay()];

    daily.push({
      date: dailyTimes[i],
      dayName,
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      precipitationProb: data.daily.precipitation_probability_max ? (data.daily.precipitation_probability_max[i] ?? 0) : 0,
      precipitationSum: Number((data.daily.precipitation_sum?.[i] ?? 0).toFixed(1)),
      weatherCode: dCode,
      conditionText: getWeatherConditionUz(dCode).text,
      windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i]),
      uvIndexMax: Math.round(data.daily.uv_index_max?.[i] ?? 4),
    });
  }

  // Parse Real Monthly History (the past 30 days up to yesterday)
  const monthlyHistory: { date: string; displayDate: string; tempMax: number; tempMin: number; tempMean: number; precipitation: number }[] = [];
  const pastLimit = Math.min(todayIndex, dailyTimes.length);
  const pastStart = Math.max(0, pastLimit - 30);

  for (let i = pastStart; i < pastLimit; i++) {
    const rawDate = dailyTimes[i];
    const dObj = new Date(rawDate);
    const dayNum = dObj.getDate();
    const monthShort = dObj.toLocaleDateString('uz-UZ', { month: 'short' });
    const maxT = Math.round(data.daily.temperature_2m_max[i]);
    const minT = Math.round(data.daily.temperature_2m_min[i]);
    const meanT = Math.round((maxT + minT) / 2);
    const precip = Number((data.daily.precipitation_sum?.[i] ?? 0).toFixed(1));

    monthlyHistory.push({
      date: rawDate,
      displayDate: `${dayNum}-${monthShort}`,
      tempMax: maxT,
      tempMin: minT,
      tempMean: meanT,
      precipitation: precip,
    });
  }

  return {
    location: {
      ...location,
      timezone,
    },
    current: {
      temp: Math.round(data.current.temperature_2m),
      apparentTemp: Math.round(data.current.apparent_temperature),
      humidity: Math.round(data.current.relative_humidity_2m),
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: Math.round(data.current.wind_direction_10m),
      pressure: Math.round(data.current.pressure_msl ?? data.current.surface_pressure ?? 1013),
      precipitation: Number((data.current.precipitation ?? 0).toFixed(1)),
      cloudCover: Math.round(data.current.cloud_cover ?? 0),
      uvIndex: Math.round(data.daily?.uv_index_max?.[todayIndex] ?? 4),
      visibility: 10.0,
      weatherCode: data.current.weather_code,
      conditionText: condition.text,
      isDay: Boolean(data.current.is_day),
      sunrise: data.daily?.sunrise?.[todayIndex] ? data.daily.sunrise[todayIndex].slice(11, 16) : '06:15',
      sunset: data.daily?.sunset?.[todayIndex] ? data.daily.sunset[todayIndex].slice(11, 16) : '18:45',
      timestamp: data.current.time,
    },
    hourly,
    daily,
    monthlyHistory,
    localTime,
  };
}

/**
 * Reverse Geocoding: Given latitude and longitude, find real Country, City and Locality
 */
export async function reverseGeocode(lat: number, lng: number): Promise<CityLocation> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=uz`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const countryName = data.countryName || 'Noma\'lum davlat';
      const cityName = data.city || data.locality || data.principalSubdivision || 'Noma\'lum hudud';
      const countryCode = (data.countryCode || 'UZ').toUpperCase();

      return {
        id: `rev-${lat.toFixed(2)}-${lng.toFixed(2)}`,
        name: cityName,
        nameUz: cityName,
        country: countryName,
        countryCode: countryCode,
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        timezone: 'auto',
        region: data.principalSubdivision || countryName,
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding fallback', err);
  }

  // Fallback to coordinates
  return {
    id: `coord-${lat.toFixed(2)}-${lng.toFixed(2)}`,
    name: `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'E' : 'W'}`,
    nameUz: `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'Sh' : 'J'}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'Shq' : 'G'}`,
    country: lat >= 0 ? 'Shimoliy yarimshar' : 'Janubiy yarimshar',
    countryCode: 'GEO',
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    timezone: 'auto',
    region: 'Global nuqta',
  };
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=uz&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: { id: number; name: string; country: string; country_code: string; latitude: number; longitude: number; timezone?: string; admin1?: string; population?: number }) => ({
      id: `geo-${r.id}`,
      name: r.name,
      nameUz: r.name,
      country: r.country || 'Noma\'lum',
      countryCode: (r.country_code || 'UN').toUpperCase(),
      lat: r.latitude,
      lng: r.longitude,
      timezone: r.timezone || 'UTC',
      population: r.population ? `${(r.population / 1_000_000).toFixed(1)}M` : undefined,
      region: r.admin1 || r.country,
    }));
  } catch (err) {
    console.error('Shahar qidiruvida xatolik:', err);
    return [];
  }
}

export function convertToDays(amount: number, unit: TimeUnit): number {
  switch (unit) {
    case 'kun':
      return amount;
    case 'hafta':
      return amount * 7;
    case 'oy':
      return Math.round(amount * 30.4375);
    case 'yil':
      return Math.round(amount * 365.25);
  }
}

export function getUnitLabelUz(amount: number, unit: TimeUnit): string {
  switch (unit) {
    case 'kun':
      return `${amount} kun`;
    case 'hafta':
      return `${amount} hafta`;
    case 'oy':
      return `${amount} oy`;
    case 'yil':
      return `${amount} yil`;
  }
}

/**
 * Historical weather calculation & lookup for time machine
 */
export async function calculateHistoricalWeather(
  location: CityLocation,
  currentWeather: WeatherData,
  amount: number,
  unit: TimeUnit
): Promise<HistoricalComparison> {
  const daysAgo = convertToDays(amount, unit);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);

  const dateStr = targetDate.toISOString().slice(0, 10);
  const timeUnitDesc = getUnitLabelUz(amount, unit);

  // If recent (within past 3 years), attempt Open-Meteo archive API
  if (daysAgo <= 1095 && daysAgo >= 2) {
    try {
      const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${location.lat}&longitude=${location.lng}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_mean,weather_code,precipitation_sum&timezone=auto`;
      const res = await fetch(archiveUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.daily && data.daily.temperature_2m_mean && data.daily.temperature_2m_mean.length > 0) {
          const pastTemp = Math.round(data.daily.temperature_2m_mean[0]);
          const pastCode = data.daily.weather_code?.[0] ?? 1;
          const pastPrecip = Number((data.daily.precipitation_sum?.[0] ?? 0).toFixed(1));
          const tempDiff = Number((currentWeather.current.temp - pastTemp).toFixed(1));
          const cond = getWeatherConditionUz(pastCode);

          return {
            targetDate: dateStr,
            daysAgo,
            timeUnitDesc,
            temp: pastTemp,
            tempDiff,
            conditionText: cond.text,
            weatherCode: pastCode,
            humidity: Math.round(55 + (pastCode % 20)),
            precipitation: pastPrecip,
            description: `Ushbu sana (${dateStr}) bo'yicha tarixiy meteorologik stansiya qaydlari: o'rtacha harorat ${pastTemp}°C bo'lgan. Bugungi harorat bilan farqi: ${tempDiff > 0 ? `+${tempDiff}°C issiqroq` : `${tempDiff}°C sovuqroq`}.`,
          };
        }
      }
    } catch (e) {
      console.warn('Archive fetch fallback to climate model', e);
    }
  }

  // Climatological cycle calculation (cosine seasonality for latitude + solar declination)
  const pastSeason = getSeasonForLocation(location.lat, targetDate);
  const dayOfYear = Math.floor((targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Base climate formula
  const equatorDistance = Math.abs(location.lat) / 90; // 0 at equator, 1 at pole
  const seasonalAmplitude = Math.max(4, 22 * equatorDistance); // poles have larger swings
  const peakSummerDay = location.lat >= 0 ? 200 : 20; // July 19 vs Jan 20
  const seasonalFactor = Math.cos(((dayOfYear - peakSummerDay) / 365) * 2 * Math.PI);
  
  const baseAvgTemp = 28 - (equatorDistance * 38); // Tropics ~28, polar -10
  const estimatedTemp = Math.round(baseAvgTemp + (seasonalFactor * seasonalAmplitude));
  const tempDiff = Number((currentWeather.current.temp - estimatedTemp).toFixed(1));

  let weatherCode = 1; // mainly clear
  if (pastSeason === 'kuz' || pastSeason === 'bahor') weatherCode = 2; // partly cloudy
  if (estimatedTemp < 0) weatherCode = 71; // light snow
  else if (seasonalFactor > 0.4 && Math.abs(location.lat) < 30) weatherCode = 0; // hot sunny

  const cond = getWeatherConditionUz(weatherCode);

  return {
    targetDate: dateStr,
    daysAgo,
    timeUnitDesc,
    temp: estimatedTemp,
    tempDiff,
    conditionText: cond.text,
    weatherCode,
    humidity: Math.round(48 + Math.abs(seasonalFactor) * 20),
    precipitation: weatherCode >= 51 ? 2.4 : 0.0,
    description: `Tarixiy iqlim modeli ma'lumotlariga ko'ra, ${timeUnitDesc} avval (${dateStr}) mintaqada ${pastSeason} fasli hukmron bo'lgan. O'rtacha harorat taxminan ${estimatedTemp}°C bo'lgan.`,
  };
}

/**
 * Future forecast & climate simulation
 * If amount > 1 month, trigger mandatory user warning:
 * "bu judaxam ko'p vaqt, sayt tahlil qilishdan adashishi mumkun"
 */
export async function calculateFutureWeather(
  location: CityLocation,
  currentWeather: WeatherData,
  amount: number,
  unit: TimeUnit
): Promise<FutureForecastResult> {
  const daysAhead = convertToDays(amount, unit);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);

  const dateStr = targetDate.toISOString().slice(0, 10);
  const timeUnitDesc = getUnitLabelUz(amount, unit);
  const projectedSeason = getSeasonForLocation(location.lat, targetDate);

  // Strict check: if requested time exceeds 1 month (~30 days)
  const isLongTermWarning = daysAhead > 30;

  // Confidence rating decreases with distance in time
  let confidenceScore = 95;
  if (daysAhead <= 3) confidenceScore = 94;
  else if (daysAhead <= 7) confidenceScore = 87;
  else if (daysAhead <= 14) confidenceScore = 78;
  else if (daysAhead <= 30) confidenceScore = 65;
  else if (daysAhead <= 90) confidenceScore = 48;
  else if (daysAhead <= 365) confidenceScore = 32;
  else confidenceScore = 18;

  // Short term (up to 7 days) can use daily forecast if available
  if (daysAhead <= 7 && currentWeather.daily && currentWeather.daily.length > daysAhead) {
    const dailyItem = currentWeather.daily[daysAhead];
    const avgTemp = Math.round((dailyItem.tempMax + dailyItem.tempMin) / 2);
    const tempDiff = Number((avgTemp - currentWeather.current.temp).toFixed(1));

    return {
      targetDate: dateStr,
      daysAhead,
      timeUnitDesc,
      temp: avgTemp,
      tempDiff,
      conditionText: dailyItem.conditionText,
      weatherCode: dailyItem.weatherCode,
      confidenceScore,
      isLongTermWarning: false,
      projectedSeason,
      climateInsight: `Rasmiy meteorologik hisob-kitoblarga ko'ra, ${timeUnitDesc}dan so'ng kunduzi yuqori harorat ${dailyItem.tempMax}°C, kechasi esa ${dailyItem.tempMin}°C atrofida bo'lishi kutilmoqda. Yog'ingarchilik ehtimoli: ${dailyItem.precipitationProb}%.`,
    };
  }

  // Climatological calculation for medium/long term
  const dayOfYear = Math.floor((targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 86400000);
  const equatorDistance = Math.abs(location.lat) / 90;
  const seasonalAmplitude = Math.max(5, 22 * equatorDistance);
  const peakSummerDay = location.lat >= 0 ? 200 : 20;
  const seasonalFactor = Math.cos(((dayOfYear - peakSummerDay) / 365) * 2 * Math.PI);
  const baseAvgTemp = 28 - (equatorDistance * 38);
  const projectedTemp = Math.round(baseAvgTemp + (seasonalFactor * seasonalAmplitude));
  const tempDiff = Number((projectedTemp - currentWeather.current.temp).toFixed(1));

  let futureCode = 1; // mainly clear
  if (projectedSeason === 'kuz') futureCode = 2; // partly cloudy
  if (projectedSeason === 'qish' && projectedTemp <= 1) futureCode = 71; // light snow
  if (projectedSeason === 'bahor') futureCode = 61; // occasional rain
  if (projectedSeason === 'yoz' && projectedTemp > 28) futureCode = 0; // hot sunny

  const cond = getWeatherConditionUz(futureCode);

  const warningMessage = isLongTermWarning
    ? `⚠️ DIQQAT: Siz ${timeUnitDesc}lik muddatni tanladingiz. Bu judaxam ko'p vaqt, sayt tahlil qilishdan adashishi mumkun! Chunki atmosfera xaos tizimi bo'lib, 1 oydan uzoq muddatli aniq ob-havoni 100% oldindan aytish dunyo meteorologiyasida ilmiy jihatdan imkonsiz. Ko'rsatilayotgan ko'rsatkich ko'p yillik orbital iqlim tendensiyasiga asoslangan ehtimoliydir.`
    : undefined;

  const climateInsight = isLongTermWarning
    ? `${timeUnitDesc}dan keyin bu hududda ${projectedSeason} fasli bo'ladi. Harorat kutilmasi o'rtacha ${projectedTemp}°C atrofida bo'lib, bugungi kundagidan ${tempDiff >= 0 ? `+${tempDiff}°C issiqroq` : `${tempDiff}°C sovuqroq`} bo'lishi ehtimoli bor.`
    : `${timeUnitDesc}dan so'ng mintaqada ${cond.text.toLowerCase()} kutilmoqda. Taxminiy harorat: ${projectedTemp}°C (${tempDiff >= 0 ? `+${tempDiff}°C` : `${tempDiff}°C`}).`;

  return {
    targetDate: dateStr,
    daysAhead,
    timeUnitDesc,
    temp: projectedTemp,
    tempDiff,
    conditionText: cond.text,
    weatherCode: futureCode,
    confidenceScore,
    isLongTermWarning,
    warningMessage,
    projectedSeason,
    climateInsight,
  };
}
