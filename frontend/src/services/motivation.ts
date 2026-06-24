import { pickLocalMessage } from '../constants/motivation';
import { MotivationType } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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
};

export type MotivationMessage = {
  message: string;
  source: 'ai' | 'local';
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
  return { message: pickLocalMessage(type, context.name, context.streakDays), source: 'local' };
}

/** Speaks the coach message out loud — the "voice" of the call. No-ops if speech is unavailable. */
export function speakMessage(message: string, onDone?: () => void) {
  const Speech = getSpeech();
  if (!Speech) {
    // Native speech unavailable — invoke onDone so the UI flow still completes.
    onDone?.();
    return;
  }
  try {
    Speech.stop();
    Speech.speak(message, {
      language: 'en-IN',
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
