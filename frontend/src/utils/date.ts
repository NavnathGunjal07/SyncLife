import { WeekDay } from '../types';

// Local calendar date (YYYY-MM-DD). toISOString() is UTC, which would file
// anything logged before 05:30 IST under the previous day.
export const toISODate = (date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toTime = (date = new Date()) =>
  date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

export const getWeekDay = (date = new Date()): WeekDay => {
  const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return day as WeekDay;
};

export const isToday = (date: string) => date === toISODate();

export const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
