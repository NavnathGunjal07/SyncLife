import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  /** Stagger offset in ms — pass index * 60 for list/grid entrances. */
  delay?: number;
  /** How far (px) the content rises while fading in. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

/** Fades + slides its children up once on mount. Native-driver only, so it's cheap. */
export function FadeInView({ children, delay = 0, offset = 14, style }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}
