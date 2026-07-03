import { createNavigationContainerRef } from '@react-navigation/native';

import { AppTabParamList, RootStackParamList } from '../types';

// Shared across RootNavigator (which binds it to the NavigationContainer) and any
// component that needs to navigate imperatively without a screen context — e.g.
// the global floating progress widget.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Switch the bottom tab from anywhere (no-op until the container is ready). */
export function goToTab(tab: keyof AppTabParamList) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('AppTabs' as never, { screen: tab } as never);
  }
}
