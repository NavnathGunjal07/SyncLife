import { useNavigation } from '@react-navigation/core';
import { useEffect, useState } from 'react';

import { getRandomFinanceQuote, getRandomGradient, getRandomQuote, Quote } from '../constants/quotes';

type Kind = 'motivation' | 'finance';

/**
 * Returns a quote + gradient that re-rolls every time the screen gains focus
 * (i.e. on each tab switch / navigation), not just on first mount.
 */
export function useRotatingQuote(kind: Kind = 'motivation'): { quote: Quote; gradient: [string, string] } {
  const navigation = useNavigation();
  const roll = () => ({
    quote: kind === 'finance' ? getRandomFinanceQuote() : getRandomQuote(),
    gradient: getRandomGradient()
  });
  const [value, setValue] = useState(roll);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => setValue(roll()));
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, kind]);
  return value;
}
