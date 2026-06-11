import { WeekDay } from '../types';

export const toISODate = (date = new Date()) => date.toISOString().slice(0, 10);

export const toTime = (date = new Date()) =>
  date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

export const getWeekDay = (date = new Date()): WeekDay => {
  const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return day as WeekDay;
};

export const isToday = (date: string) => date === toISODate();

export const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
