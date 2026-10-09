import { Router, Request, Response } from 'express';

import {
  APP_NAME,
  DELETE_ACCOUNT_PAGE,
  EFFECTIVE_DATE,
  LEGAL_VERSION,
  LegalDoc,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE
} from '../legal/content.js';

// Public (no auth) — these URLs go into the Play Console listing:
//   /api/legal/privacy, /api/legal/terms, /api/legal/delete-account
const router = Router();

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderDoc(doc: LegalDoc, embedded: boolean) {
  const sections = doc.sections
    .map((section) => {
      const paragraphs = section.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';
      return `<h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}`;
    })
    .join('');

  // The app's WebView passes ?embed=1: dark theme to match the app, no page title
  // (the native header already shows it).
  const heading = embedded ? '' : `<h1>${escapeHtml(doc.title)}</h1>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(doc.title)} · ${APP_NAME}</title>
<style>
  :root { --bg: #ffffff; --text: #1a1a1a; --muted: #5c5c5c; --accent: #0a7a52; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0a0a0a; --text: #f2f2f2; --muted: #a3a3a3; --accent: #22c55e; } }
  ${embedded ? ':root { --bg: #0a0a0a; --text: #f2f2f2; --muted: #a3a3a3; --accent: #22c55e; }' : ''}
  body { background: var(--bg); color: var(--text); font: 16px/1.6 system-ui, -apple-system, Roboto, sans-serif; margin: 0; }
  main { max-width: 720px; margin: 0 auto; padding: ${embedded ? '8px 18px 40px' : '32px 16px 64px'}; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 28px 0 6px; color: var(--accent); }
  p, li { color: var(--text); }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
  .meta { color: var(--muted); font-size: 14px; margin: 0 0 16px; }
  .intro { font-weight: 600; }
</style>
</head>
<body><main>
${heading}
<p class="meta">Effective ${EFFECTIVE_DATE} · Version ${LEGAL_VERSION}</p>
<p class="intro">${escapeHtml(doc.intro)}</p>
${sections}
</main></body>
</html>`;
}

function send(doc: LegalDoc) {
  return (req: Request, res: Response) => {
    res.type('html').send(renderDoc(doc, req.query.embed === '1'));
  };
}

router.get('/privacy', send(PRIVACY_POLICY));
router.get('/terms', send(TERMS_OF_SERVICE));
router.get('/delete-account', send(DELETE_ACCOUNT_PAGE));
router.get('/version', (_req, res) => {
  res.json({ version: LEGAL_VERSION });
});

export default router;
