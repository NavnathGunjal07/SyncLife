import { pickLocalMessage, pickLocalReply, SPEECH_LOCALES } from '../constants/motivation';
import { CoachLanguage, MotivationType, Ringtone } from '../types';
import { API_BASE } from './api';

// Same base URL as every other API call (falls back to the emulator host in dev).
const API_BASE_URL = API_BASE;

// expo-speech relies on a native module ('ExpoSpeech') that is present in
// development/production builds but may be unavailable in some runtimes
// (e.g. an outdated Expo Go shell). Load it lazily and degrade gracefully so a
// missing native module never crashes the motivation call — the text still shows.
let speechModule: typeof import('expo-speech') | null = null;
let speechLoadFailed = false;

function getSpeech(): typeof import('expo-speech') | null {
  if (speechModule || speechLoadFailed) return speechModule;
  try {
    speechModule = require('expo-speech') as typeof import('expo-speech');
  } catch {
    speechLoadFailed = true;
    speechModule = null;
  }
  return speechModule;
}

export type MotivationContext = {
  name?: string;
  streakDays?: number;
  workoutDoneToday?: boolean;
  /** Language the coach should speak in ('en' | 'hi' | 'mr'). */
  language?: CoachLanguage;
};

export type MotivationMessage = {
  message: string;
  source: 'ai' | 'local';
};

export type CallTurn = {
  role: 'assistant' | 'user';
  content: string;
};

/**
 * Fetches a personalized motivational message from the backend (Claude-powered
 * when the server has an API key). Falls back to the local message bank when
 * offline, signed out, or the backend is unreachable.
 */
export async function getMotivationMessage(type: MotivationType, accessToken: string | null, context: MotivationContext = {}): Promise<MotivationMessage> {
  if (API_BASE_URL && accessToken) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/motivation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, ...context, timeOfDay: new Date().getHours() }),
        signal: controller.signal
      });
      if (response.ok) {
        const data = (await response.json()) as { message?: string };
        if (data.message) {
          return { message: data.message, source: 'ai' };
        }
      }
    } catch {
      // Offline or backend down — fall through to the local bank
    } finally {
      clearTimeout(timeout);
    }
  }
  return { message: pickLocalMessage(type, context.name, context.streakDays, context.language), source: 'local' };
}

/**
 * Sends the running call conversation to the backend and returns the coach's
 * reply to whatever the user just said, keeping the call two-way. Falls back to
 * an encouraging local reply when offline/unreachable.
 */
export async function getMotivationReply(
  type: MotivationType,
  history: CallTurn[],
  accessToken: string | null,
  context: MotivationContext = {}
): Promise<MotivationMessage> {
  if (API_BASE_URL && accessToken) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/motivation/reply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, ...context, timeOfDay: new Date().getHours(), history }),
        signal: controller.signal
      });
      if (response.ok) {
        const data = (await response.json()) as { message?: string };
        if (data.message) {
          return { message: data.message, source: 'ai' };
        }
      }
    } catch {
      // Offline or backend down — fall through to the local reply
    } finally {
      clearTimeout(timeout);
    }
  }
  return { message: pickLocalReply(type, context.name, context.language), source: 'local' };
}

/** Speaks the coach message out loud — the "voice" of the call. No-ops if speech is unavailable. */
export function speakMessage(message: string, onDone?: () => void, language: CoachLanguage = 'en') {
  const Speech = getSpeech();
  if (!Speech) {
    // Native speech unavailable — invoke onDone so the UI flow still completes.
    onDone?.();
    return;
  }
  try {
    Speech.stop();
    Speech.speak(message, {
      language: SPEECH_LOCALES[language],
      pitch: 1.0,
      rate: 0.95,
      onDone,
      onError: onDone
    });
  } catch {
    onDone?.();
  }
}

export function stopSpeaking() {
  const Speech = getSpeech();
  if (!Speech) return;
  try {
    Speech.stop();
  } catch {
    // ignore
  }
}
