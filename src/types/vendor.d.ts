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
}

declare module '@gorhom/bottom-sheet' {
  import { ComponentType, ReactNode, Ref } from 'react';
  import { ViewStyle } from 'react-native';

  type Props = {
    ref?: Ref<unknown>;
    index?: number;
    snapPoints: Array<string | number>;
    enablePanDownToClose?: boolean;
    onClose?: () => void;
    backgroundStyle?: ViewStyle;
    handleIndicatorStyle?: ViewStyle;
    children?: ReactNode;
  };

  const BottomSheet: ComponentType<Props>;
  export const BottomSheetView: ComponentType<{ style?: ViewStyle; children?: ReactNode }>;
  export default BottomSheet;
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
  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<{ shouldPlaySound: boolean; shouldSetBadge: boolean; shouldShowAlert: boolean }>;
  }): void;
  export function getPermissionsAsync(): Promise<{ granted: boolean }>;
  export function requestPermissionsAsync(): Promise<{ granted: boolean }>;
  export function cancelAllScheduledNotificationsAsync(): Promise<void>;
  export function scheduleNotificationAsync(config: {
    content: { title: string; body: string };
    trigger: { hour: number; minute: number; repeats: boolean } | Date;
  }): Promise<string>;
}
