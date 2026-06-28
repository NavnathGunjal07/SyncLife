import { Ionicons } from '@expo/vector-icons';

import { MotivationType, Ringtone } from '../types';

export const COACH_NAME = 'SyncLife Coach';

// ─── Ringtones ────────────────────────────────────────────────────────────────
// The bundled WAVs do double duty: expo-audio loops them in-app on the ringing
// call screen, and the Android notification channels reference them by filename.

export const DEFAULT_RINGTONE: Ringtone = 'classic';

export const RINGTONES: { id: Ringtone; label: string; file: string }[] = [
  { id: 'classic', label: 'Classic alarm', file: 'alarm_classic.wav' },
  { id: 'gentle', label: 'Gentle chime', file: 'alarm_gentle.wav' },
  { id: 'digital', label: 'Digital', file: 'alarm_digital.wav' }
];

/** Static require() map so Metro bundles each ringtone (dynamic require fails). */
export const RINGTONE_SOURCES: Record<Ringtone, number> = {
  classic: require('../../assets/sounds/alarm_classic.wav'),
  gentle: require('../../assets/sounds/alarm_gentle.wav'),
  digital: require('../../assets/sounds/alarm_digital.wav')
};

export function ringtoneFile(ringtone: Ringtone): string {
  return RINGTONES.find((r) => r.id === ringtone)?.file ?? 'alarm_classic.wav';
}

export const CALL_BODY: Record<MotivationType, string> = {
  gym: 'Your coach is calling — time to train. Tap to answer 💪',
  work: 'Your coach is calling — time to get to work. Tap to answer 🚀',
  reminder: 'Your coach is calling — quick reminder for you. Tap to answer ⏰',
  sleep: 'Your coach is calling — time to wind down. Tap to answer 🌙'
};

/** UI metadata for each call type (used by the alarms card and call screen). */
export const MOTIVATION_META: Record<MotivationType, { label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = {
  gym: { label: 'Gym', subtitle: 'Workout motivation call', icon: 'fitness' },
  work: { label: 'Work', subtitle: 'Work focus call', icon: 'briefcase' },
  reminder: { label: 'Reminder', subtitle: 'Reminder call', icon: 'alarm' },
  sleep: { label: 'Sleep', subtitle: 'Wind-down call', icon: 'moon' }
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
  ],
  reminder: [
    'This is your coach with a quick nudge. You set this reminder for a reason, and that reason still matters. Take two minutes and handle it now before it slips away.',
    'Hey, this is the thing you promised yourself you would do. Future you is counting on present you. Knock it out now and feel the weight lift off your shoulders.',
    'Small tasks become big stress when we wait. This one is small. Do it right now while it is in front of you, and you will be done before you know it.',
    'You asked me to remind you, so here I am. One quick action closes this loop. Let us take care of it together — start now.'
  ],
  sleep: [
    'This is your coach. The most powerful thing you can do for tomorrow is rest tonight. Screens down, lights low, and let your body recover. Sleep is training too.',
    'Champions are made in recovery as much as in effort. Wind down now — put the phone on charge across the room and give yourself a full night of sleep.',
    'Your brain and muscles repair while you sleep. Skipping it steals from tomorrow. Close the day proud, breathe slow, and head to bed now.',
    'The day is done and you showed up. Now protect your energy for tomorrow. Dim the lights, set your alarm, and let yourself rest.'
  ]
};

export function pickLocalMessage(type: MotivationType, name?: string, streakDays?: number): string {
  const bank = MOTIVATION_BANK[type];
  const base = bank[Math.floor(Math.random() * bank.length)];
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const streakLine = streakDays && streakDays > 1 ? ` You are on a ${streakDays} day streak — do not break it today.` : '';
  return `${greeting}${base}${streakLine}`;
}

/** Encouraging local reply when the user talks back and the backend is unreachable. */
export function pickLocalReply(type: MotivationType, name?: string): string {
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const lines: Record<MotivationType, string> = {
    gym: `${greeting}I hear you — but you do not have to feel ready, you just have to start. Do the first five minutes and let momentum take over. Shoes on, let us go.`,
    work: `${greeting}totally fair. Forget the whole thing — just open it and set a five minute timer. Starting is the hard part, and you are about to win it.`,
    reminder: `${greeting}I get it, life is busy. This one is quick though. Take two minutes right now and close the loop — you will feel lighter the moment it is done.`,
    sleep: `${greeting}I know it is tempting to push on, but rest is how you win tomorrow. Put the screen down, dim the lights, and give yourself a proper night.`
  };
  return lines[type];
}
