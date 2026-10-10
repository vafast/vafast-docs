#!/usr/bin/env node
// Build-time snapshot of the shared Okayok product list + footer links
// (Supabase project superly, tables okayok_products / okayok_footer_links).
// writes docs/.vitepress/theme/okayok-family.json, which is bundled as the SSR/first-paint
// data and as the fallback if Supabase is unreachable in the browser.
// Never fails the build: on any error the committed snapshot is kept.
// Source of truth: ~/Documents/workspace/infra/okayok-shared (copy into each site repo).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const URL_ =
  process.env.VITE_OKAYOK_SUPABASE_URL ||
  'https://oacvulcjdoyyoelkalwq.supabase.co';
const KEY =
  process.env.VITE_OKAYOK_SUPABASE_KEY ||
  'sb_publishable_wxZiInZOk6lml3_EeNE8MA_2rQrzif4';
const OUT = fileURLToPath(new URL('../docs/.vitepress/theme/okayok-family.json', import.meta.url));

async function get(path) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

try {
  const [products, footerLinks] = await Promise.all([
    get(
      'okayok_products?select=slug,name,name_zh,url,description,description_zh,cta,cta_zh,icon,icon_url,sort_order,show_in_footer,show_in_products&is_visible=eq.true&order=sort_order.asc'
    ),
    get(
      'okayok_footer_links?select=column_key,column_title,column_title_zh,column_order,label,label_zh,url,sort_order,open_in_new_tab,site_slugs&is_visible=eq.true&order=column_order.asc,sort_order.asc'
    ),
  ]);
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
