import Constants from 'expo-constants';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

type ExtraConfig = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const firebaseConfig = {
  apiKey: extra.firebaseApiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: extra.firebaseAuthDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: extra.firebaseProjectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: extra.firebaseStorageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    extra.firebaseMessagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.firebaseAppId ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Reuse existing app on hot reload
const existingApps = getApps();
export const firebaseApp = existingApps.length
  ? existingApps[0]
  : initializeApp(firebaseConfig);

/**
 * Note on persistence: Firebase JS SDK v10 with Expo uses session-level auth.
 * Long-term auth state (user, accessToken, tokenExpiresAt) is stored in the
 * Zustand auth store with AsyncStorage persistence — this is what survives
 * app restarts. Firebase auth is used only for the signInWithCredential call.
 */
export const firebaseAuth = getAuth(firebaseApp);
