import { MotivationType } from '../types';

export const COACH_NAME = 'SyncLife Coach';

export const CALL_BODY: Record<MotivationType, string> = {
  gym: 'Your coach is calling — time to train. Tap to answer 💪',
  work: 'Your coach is calling — time to get to work. Tap to answer 🚀'
};

/** Offline / no-backend fallback messages, spoken by the coach on the call screen. */
export const MOTIVATION_BANK: Record<MotivationType, string[]> = {
  gym: [
    'This is your coach speaking. The gym is waiting and your future self is watching. Get up, lace your shoes, and give me one great session. You never regret the workout you finished.',
    'Hey champion, decision time. You can scroll for an hour, or you can train for forty five minutes and feel unstoppable all day. Grab your gear — we start now.',
    'Discipline beats motivation, and you only need ten seconds of discipline to walk out the door. Move now, think later. Your streak is on the line.',
    'Remember why you started. Stronger body, calmer mind, better life. None of that happens on the couch. Stand up right now and let us get this workout done.',
    'One workout will not change your body, but skipping one will change your momentum. Protect the streak. Shoes on, water bottle filled, let us go.',
    'Your muscles do not know what day it is — they only know whether you showed up. Show up today. Even a short session counts. Start with one set and the rest will follow.',
    'You have trained on harder days than this. Today is easy mode. Get to the gym, do the work, and come back proud of yourself.',
    'The hardest rep is leaving the house. Win that one rep and the whole workout is yours. I believe in you — now move.'
  ],
  work: [
    'This is your coach. The work will not do itself, and future you is begging present you to start. Open the task, set a timer for twenty five minutes, and go.',
    'Deep breath. You do not need to finish everything — you only need to start one thing. Pick the most important task and give it your full focus right now.',
    'Every successful day starts with one decisive moment. This is it. Close the distractions, open your work, and make the next hour count.',
    'Discipline is choosing what you want most over what you want now. What you want most is progress. Start the work — momentum will carry you.',
    'You are one focused session away from feeling on top of your day. Phone face down, one task on screen, timer on. Let us go.',
    'Procrastination is just fear in comfortable clothes. You are more capable than the task is hard. Start small, start now.',
    'Imagine ending today knowing you did the hard thing first. That feeling is twenty five focused minutes away. Begin.',
    'Your goals do not care about your mood, but they respond beautifully to your actions. Take action now — start the most important task on your list.'
  ]
};

export function pickLocalMessage(type: MotivationType, name?: string, streakDays?: number): string {
  const bank = MOTIVATION_BANK[type];
  const base = bank[Math.floor(Math.random() * bank.length)];
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const streakLine = streakDays && streakDays > 1 ? ` You are on a ${streakDays} day streak — do not break it today.` : '';
  return `${greeting}${base}${streakLine}`;
}
