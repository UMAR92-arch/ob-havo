export type Season = 'kuz' | 'qish' | 'bahor' | 'yoz';

export type TimeUnit = 'kun' | 'hafta' | 'oy' | 'yil';

export interface CityLocation {
  id: string;
  name: string;
  nameUz: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  timezone: string;
  isCapital?: boolean;
  population?: string;
  region?: string;
  tier?: number; // 1: world capital, 2: major city, 3: detailed local city
}

export interface HourlyForecast {
  time: string; // ISO or 'HH:00'
  temp: number;
  apparentTemp: number;
  precipitationProb: number;
  weatherCode: number;
  conditionText: string;
  isDay: boolean;
}

export interface DailyForecast {
  date: string; // 'YYYY-MM-DD'
  dayName: string; // 'Dushanba', etc.
  tempMax: number;
  tempMin: number;
  precipitationProb: number;
  precipitationSum: number;
  weatherCode: number;
  conditionText: string;
  windSpeedMax: number;
  uvIndexMax: number;
}

export interface HistoricalDailyPoint {
  date: string;
  displayDate: string;
  tempMax: number;
  tempMin: number;
  tempMean: number;
  precipitation: number;
}

export interface WeatherData {
  location: CityLocation;
  current: {
    temp: number;
    apparentTemp: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    precipitation: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    weatherCode: number;
    conditionText: string;
    isDay: boolean;
    sunrise: string;
    sunset: string;
    timestamp: string;
  };
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  monthlyHistory: HistoricalDailyPoint[];
  localTime: {
    timeString: string; // HH:MM:SS
    dateString: string;
    dayOfWeek: string;
    utcOffset: string;
    isDaytime: boolean;
    rawDate: Date;
  };
}

export interface HistoricalComparison {
  targetDate: string;
  daysAgo: number;
  timeUnitDesc: string;
  temp: number;
  tempDiff: number; // current - past
  conditionText: string;
  weatherCode: number;
  humidity: number;
  precipitation: number;
  description: string;
}

export interface FutureForecastResult {
  targetDate: string;
  daysAhead: number;
  timeUnitDesc: string;
  temp: number;
  tempDiff: number; // future - current
  conditionText: string;
  weatherCode: number;
  confidenceScore: number; // percentage, e.g. 92% for 3 days, 45% for 6 months
  isLongTermWarning: boolean;
  warningMessage?: string;
  projectedSeason: Season;
  climateInsight: string;
}
