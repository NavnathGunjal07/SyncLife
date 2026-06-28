declare module '@tanstack/react-query' {
  import { ComponentType, ReactNode } from 'react';

  export class QueryClient {
    constructor(config?: unknown);
  }

  export const QueryClientProvider: ComponentType<{ client: QueryClient; children: ReactNode }>;

  export function useQuery<TData = unknown>(config: {
    queryKey: unknown[];
    enabled?: boolean;
    queryFn: () => Promise<TData>;
    staleTime?: number;
  }): { data?: TData; isLoading: boolean; error: unknown; refetch: () => Promise<unknown> };
}

declare module '@react-navigation/core' {
  export const CommonActions: {
    reset: (state: { index: number; routes: Array<{ name: string }> }) => unknown;
  };

  export function useNavigation<T = {
    navigate: (name: string, params?: unknown) => void;
    dispatch: (action: unknown) => void;
    addListener: (event: 'focus' | 'blur' | 'state', callback: () => void) => () => void;
  }>(): T;

  export function useFocusEffect(effect: () => void | (() => void)): void;

  export function createNavigationContainerRef<ParamList = Record<string, unknown>>(): {
    isReady: () => boolean;
    navigate: (name: keyof ParamList & string, params?: unknown) => void;
  };
}

declare module 'firebase/app' {
  export function initializeApp(config: Record<string, unknown>): unknown;
  export function getApps(): unknown[];
}

declare module 'firebase/auth' {
  export type UserCredential = {
    user: {
      uid: string;
      displayName: string | null;
      email: string | null;
      photoURL: string | null;
    };
  };

  export function getAuth(app?: unknown): unknown;
  export function signOut(auth: unknown): Promise<void>;
  export const GoogleAuthProvider: {
    credential: (idToken?: string, accessToken?: string) => unknown;
  };
  export function signInWithCredential(auth: unknown, credential: unknown): Promise<UserCredential>;
}

// NOTE: expo-notifications ships its own complete TypeScript types. Do not stub
// it here — a hand-written stub previously hid the Android trigger API
// (DAILY trigger, notification channels) and led to iOS-only calendar triggers
// that silently threw on Android.
