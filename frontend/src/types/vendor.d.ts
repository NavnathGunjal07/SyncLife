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
  }>(): T;

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

declare module 'expo-notifications' {
  export type Notification = {
    request: {
      content: {
        title: string | null;
        body: string | null;
        data: Record<string, any>;
      };
    };
  };

  export type NotificationResponse = {
    notification: Notification;
  };

  export type Subscription = { remove: () => void };

  export function setNotificationHandler(handler: {
    handleNotification: (notification: Notification) => Promise<{ shouldPlaySound: boolean; shouldSetBadge: boolean; shouldShowAlert: boolean }>;
  }): void;
  export function getPermissionsAsync(): Promise<{ granted: boolean }>;
  export function requestPermissionsAsync(): Promise<{ granted: boolean }>;
  export function cancelAllScheduledNotificationsAsync(): Promise<void>;
  export function cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  export function scheduleNotificationAsync(config: {
    content: { title: string; body: string; sound?: boolean | string; data?: Record<string, unknown> };
    trigger: { hour: number; minute: number; repeats: boolean } | Date;
  }): Promise<string>;
  export function getLastNotificationResponseAsync(): Promise<NotificationResponse | null>;
  export function addNotificationResponseReceivedListener(listener: (response: NotificationResponse) => void): Subscription;
}
