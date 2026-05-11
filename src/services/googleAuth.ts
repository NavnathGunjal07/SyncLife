import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

import { firebaseAuth } from './firebase';
import { AuthUser } from '../types';

WebBrowser.maybeCompleteAuthSession();

type GoogleExtra = {
  googleWebClientId?: string;
  googleAndroidClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;

export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

export const useGoogleAuthRequest = () =>
  Google.useAuthRequest({
    webClientId: extra.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: extra.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: GOOGLE_SCOPES,
    responseType: 'id_token token',
    extraParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  });

export async function signInWithGoogleTokens(idToken: string, accessToken: string): Promise<AuthUser> {
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const result = await signInWithCredential(firebaseAuth, credential);
  const user = result.user;
  return {
    uid: user.uid,
    name: user.displayName ?? 'SyncLife User',
    email: user.email ?? '',
    photoURL: user.photoURL ?? undefined
  };
}
