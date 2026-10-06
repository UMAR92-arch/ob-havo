import { useState, useEffect } from 'react';

export interface LiveClockInfo {
  timeString: string; // HH:MM:SS
  dateString: string;
  dayOfWeek: string;
  utcOffset: string;
}

export function useLiveClock(timezone: string = 'UTC'): LiveClockInfo {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  try {
    const timeFormatter = new Intl.DateTimeFormat('uz-UZ', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const timeString = timeFormatter.format(now);

    const dateFormatter = new Intl.DateTimeFormat('uz-UZ', {
      timeZone: timezone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const dateString = dateFormatter.format(now);

    const dayFormatter = new Intl.DateTimeFormat('uz-UZ', {
      timeZone: timezone,
      weekday: 'long',
    });
    const rawDay = dayFormatter.format(now);
    const dayOfWeek = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);

    // Calculate UTC offset
    const utcHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(now);
    const localHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(now);

    const [uH, uM] = utcHourStr.split(':').map(Number);
    const [lH, lM] = localHourStr.split(':').map(Number);
    let diffMinutes = (lH * 60 + lM) - (uH * 60 + uM);
    if (diffMinutes < -720) diffMinutes += 1440;
    if (diffMinutes > 720) diffMinutes -= 1440;
    const offsetHours = Math.floor(Math.abs(diffMinutes) / 60);
    const offsetMins = Math.abs(diffMinutes) % 60;
    const sign = diffMinutes >= 0 ? '+' : '-';
    const utcOffset = `UTC${sign}${offsetHours}${offsetMins > 0 ? `:${offsetMins}` : ''}`;

    return {
      timeString,
      dateString,
      dayOfWeek,
      utcOffset,
    };
  } catch {
    return {
      timeString: now.toLocaleTimeString('uz-UZ'),
      dateString: now.toLocaleDateString('uz-UZ'),
      dayOfWeek: 'Bugun',
      utcOffset: 'UTC',
    };
  }
}
