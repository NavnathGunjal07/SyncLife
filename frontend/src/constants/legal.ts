import { API_BASE } from '../services/api';

/**
 * Must match LEGAL_VERSION in backend/src/legal/content.ts. When it changes,
 * existing users see the consent screen again and must accept the new terms.
 */
export const LEGAL_VERSION = '2026-10-10';

export type LegalDocKind = 'terms' | 'privacy' | 'delete-account';

export const LEGAL_TITLES: Record<LegalDocKind, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  'delete-account': 'Delete account'
};

/** Public URL (also used in the Play Console listing). `embed` = in-app styling. */
export function legalUrl(kind: LegalDocKind, embed = false) {
  return `${API_BASE}/api/legal/${kind}${embed ? '?embed=1' : ''}`;
}
