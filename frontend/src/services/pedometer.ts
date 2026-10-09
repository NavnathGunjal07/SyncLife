import { Pedometer } from 'expo-sensors';

/**
 * Thin wrapper over expo-sensors Pedometer.
 *
 * Android has no historical step API, so we can only *watch* live steps while the
 * app is open — the callback reports steps counted since the subscription began.
 * The steps store turns that delta into a persisted daily total.
 */

export async function isStepTrackingAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Checks the activity permission without showing the system prompt. */
export async function hasStepPermission(): Promise<boolean> {
  try {
    const { granted } = await Pedometer.getPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

export async function requestStepPermission(): Promise<boolean> {
  try {
    const { granted } = await Pedometer.requestPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/** Live step count since subscription. Returns a remover; call it to stop. */
export function watchSteps(onUpdate: (sessionSteps: number) => void): () => void {
  const sub = Pedometer.watchStepCount((result) => onUpdate(result.steps));
  return () => sub.remove();
}

/**
 * Steps since midnight, when the platform supports it (iOS/HealthKit). Returns
 * null on Android where historical queries aren't available.
 */
export async function getTodaySteps(): Promise<number | null> {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, new Date());
    return result.steps;
  } catch {
    return null;
  }
}
