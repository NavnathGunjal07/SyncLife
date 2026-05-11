import { useQuery } from '@tanstack/react-query';

import { fetchSheetRows } from '../services/googleSheets';
import { useAuthStore } from '../store/auth';

export function useSheetsRows<T>(sheetName: string) {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ['sheet', sheetName],
    enabled: Boolean(token),
    queryFn: () => fetchSheetRows<T>(token ?? '', sheetName),
    staleTime: 5 * 60 * 1000
  });
}
