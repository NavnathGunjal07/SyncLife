import { pickLocalMessage, pickLocalReply, RINGTONE_SOURCES } from '../constants/motivation';
import { MotivationType, Ringtone } from '../types';

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

// expo-speech-recognition is an optional native module (config plugin + custom
// dev/prod build). Loaded lazily so the call screen still works — text-only —
// when the module is absent (e.g. Expo Go) or the device lacks recognition.
// A minimal local type is used (instead of `typeof import(...)`) so typecheck
// passes even before the package is installed into node_modules.
type RecognitionSubscription = { remove: () => void };
type RecognitionResultEvent = { results?: { transcript?: string }[]; isFinal?: boolean };
type RecognitionErrorEvent = { message?: string; error?: string };
type SpeechRecognitionModule = {
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: () => Promise<{ granted: boolean }>;
    start: (options: { lang?: string; interimResults?: boolean; continuous?: boolean }) => void;
    stop: () => void;
    addListener: ((event: 'result', handler: (e: RecognitionResultEvent) => void) => RecognitionSubscription) &
      ((event: 'error', handler: (e: RecognitionErrorEvent) => void) => RecognitionSubscription) &
      ((event: 'end', handler: () => void) => RecognitionSubscription);
  };
};
let recognitionModule: SpeechRecognitionModule | null = null;
let recognitionLoadFailed = false;

function getRecognition(): SpeechRecognitionModule | null {
  if (recognitionModule || recognitionLoadFailed) return recognitionModule;
  try {
    recognitionModule = require('expo-speech-recognition') as SpeechRecognitionModule;
  } catch {
    recognitionLoadFailed = true;
    recognitionModule = null;
  }
  return recognitionModule;
}

// expo-audio plays the looping ringtone in-app while the call screen "rings".
// Lazily required so a missing native module degrades to vibration-only.
type AudioModule = typeof import('expo-audio');
let audioModule: AudioModule | null = null;
let audioLoadFailed = false;

function getAudio(): AudioModule | null {
  if (audioModule || audioLoadFailed) return audioModule;
  try {
    audioModule = require('expo-audio') as AudioModule;
  } catch {
    audioLoadFailed = true;
    audioModule = null;
  }
  return audioModule;
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
  return { message: pickLocalMessage(type, context.name, context.streakDays), source: 'local' };
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
  return { message: pickLocalReply(type, context.name), source: 'local' };
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

// ─── Incoming-call ringtone (looping audio) ───────────────────────────────────

let ringPlayer: ReturnType<AudioModule['createAudioPlayer']> | null = null;

/**
 * Starts looping the chosen ringtone out loud — the audible "ringing" of an
 * incoming coach call. Returns false (vibration still covers it) when audio is
 * unavailable. Safe to call repeatedly; replaces any current ring.
 */
export async function startRinging(ringtone: Ringtone): Promise<boolean> {
  const Audio = getAudio();
  if (!Audio) return false;
  try {
    stopRinging();
    // Ring even when the phone's mute switch is on — it is an alarm-style call.
    await Audio.setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
    const player = Audio.createAudioPlayer(RINGTONE_SOURCES[ringtone]);
    player.loop = true;
    player.volume = 1.0;
    player.play();
    ringPlayer = player;
    return true;
  } catch {
    ringPlayer = null;
    return false;
  }
}

/** Stops and releases the looping ringtone. No-op when nothing is ringing. */
export function stopRinging() {
  if (!ringPlayer) return;
  try {
    ringPlayer.pause();
    ringPlayer.remove();
  } catch {
    // ignore
  }
  ringPlayer = null;
}

/** Plays a ringtone once for previewing in the picker. Auto-releases on finish. */
export async function previewRingtone(ringtone: Ringtone): Promise<void> {
  const Audio = getAudio();
  if (!Audio) return;
  try {
    stopRinging();
    await Audio.setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
    const player = Audio.createAudioPlayer(RINGTONE_SOURCES[ringtone]);
    player.volume = 1.0;
    player.play();
    ringPlayer = player;
  } catch {
    ringPlayer = null;
  }
}

// ─── Voice input (speech-to-text) ─────────────────────────────────────────────

/** Whether the device has the speech-recognition native module available. */
export function isVoiceInputAvailable(): boolean {
  return getRecognition() !== null;
}

type VoiceCallbacks = {
  /** Live partial transcript as the user speaks. */
  onPartial?: (text: string) => void;
  /** Final transcript when recognition settles. */
  onResult?: (text: string) => void;
  /** Recognition ended (mic released), regardless of result. */
  onEnd?: () => void;
  /** Permission denied, unavailable, or a recognition error. */
  onError?: (message: string) => void;
};

let activeSubscriptions: { remove: () => void }[] = [];

function clearVoiceSubscriptions() {
  for (const sub of activeSubscriptions) {
    try {
      sub.remove();
    } catch {
      // ignore
    }
  }
  activeSubscriptions = [];
}

/**
 * Starts listening to the microphone and streams transcripts back through the
 * callbacks. Returns false (and fires onError) when voice input is unavailable
 * or permission is denied — callers should keep the text input as the fallback.
 */
export async function startListening(callbacks: VoiceCallbacks): Promise<boolean> {
  const Recognition = getRecognition();
  if (!Recognition) {
    callbacks.onError?.('Voice input is not available on this build.');
    return false;
  }

  const Module = Recognition.ExpoSpeechRecognitionModule;
  try {
    const perm = await Module.requestPermissionsAsync();
    if (!perm.granted) {
      callbacks.onError?.('Microphone permission denied.');
      return false;
    }

    clearVoiceSubscriptions();

    activeSubscriptions.push(
      Module.addListener('result', (event: { results?: { transcript?: string }[]; isFinal?: boolean }) => {
        const transcript = event.results?.[0]?.transcript?.trim();
        if (!transcript) return;
        if (event.isFinal) {
          callbacks.onResult?.(transcript);
        } else {
          callbacks.onPartial?.(transcript);
        }
      })
    );
    activeSubscriptions.push(
      Module.addListener('error', (event: { message?: string; error?: string }) => {
        callbacks.onError?.(event.message ?? event.error ?? 'Voice recognition error.');
      })
    );
    activeSubscriptions.push(
      Module.addListener('end', () => {
        callbacks.onEnd?.();
        clearVoiceSubscriptions();
      })
    );

    Module.start({
      lang: 'en-IN',
      interimResults: true,
      continuous: false
    });
    return true;
  } catch (error) {
    clearVoiceSubscriptions();
    callbacks.onError?.(error instanceof Error ? error.message : 'Could not start voice input.');
    return false;
  }
}

/** Stops an in-progress listening session (the 'end' event still fires). */
export function stopListening() {
  const Recognition = getRecognition();
  if (!Recognition) return;
  try {
    Recognition.ExpoSpeechRecognitionModule.stop();
  } catch {
    clearVoiceSubscriptions();
  }
}
