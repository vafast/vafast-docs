#!/usr/bin/env node
// Build-time snapshot of the shared Okayok product list + footer links
// (okayok-api GET /api/public/okayok-family; tables okayok_products / okayok_footer_links).
// writes docs/.vitepress/theme/okayok-family.json, which is bundled as the SSR/first-paint
// data and as the fallback if okayok-api is unreachable in the browser.
// Never fails the build: on any error the committed snapshot is kept.
// Source of truth: ~/Documents/workspace/infra/okayok-shared (copy into each site repo).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FAMILY_URL =
  process.env.VITE_OKAYOK_FAMILY_URL ||
  'https://designokay-production.up.railway.app/api/public/okayok-family';
const OUT = fileURLToPath(new URL('../docs/.vitepress/theme/okayok-family.json', import.meta.url));

try {
  const res = await fetch(FAMILY_URL, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { products, footerLinks = [] } = await res.json();
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('empty product list');
  }
  writeFileSync(OUT, JSON.stringify({ products, footerLinks }, null, 2) + '\n');
  console.log(
    `[okayok-family] snapshot: ${products.length} products, ${footerLinks.length} footer links`
  );
} catch (err) {
  console.warn(`[okayok-family] keeping committed snapshot (${err.message})`);
}
