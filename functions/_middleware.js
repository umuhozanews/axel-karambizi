/**
 * Injects the admin portal's content into the deployed HTML as it streams, so
 * a save is visible on the next request instead of on the next deployment.
 *
 * This Pages project is direct-upload: commits pushed by the admin portal are
 * never built, which is why edits used to disappear. The portal now writes the
 * content to KV, and everything below reads from KV on the way out.
 *
 * The deployed markup stays the source of truth for layout, and the rewrite is
 * applied to it fresh on every request, so it is idempotent no matter how many
 * times the copy is edited.
 */
import { CONTENT_MAP } from './_content-map.js';

const CONTENT_KEY = 'site:content';
const ASSET_PREFIX = 'asset:';

const PAGE_KEYS = {
  '/': 'index',
  '/about': 'about',
  '/projects': 'projects',
  '/explore': 'explore',
  '/blogs': 'blogs',
};

// Story pages that exist in the export. If the admin deletes the story, these
// URLs redirect to /blogs/ instead of showing leftover copy.
const STORY_PAGES = new Set([
  'dubai-opportunity',
  'cross-border-founders',
  'people-i-met',
  'lake-kivu-speed',
  'lake-kivu-stillness',
]);

const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', ico: 'image/x-icon',
};

function pageKeyFor(pathname) {
  const clean = pathname.replace(/\/index\.html$/, '/').replace(/(.)\/$/, '$1');
  return PAGE_KEYS[clean] || null;
}

// content.json stores asset paths relative to the site root ("./assets/x.jpg");
// every page except the home page needs one level up. A revision query is
// appended so a replaced file of the same name is not served from cache.
function resolveAsset(value, pageKey, rev) {
  if (typeof value !== 'string') return value;
  if (/^(https?:)?\/\//.test(value) || value.startsWith('data:')) return value;
  const bare = value.replace(/^\.{1,2}\//, '').split('?')[0];
  const prefix = pageKey === 'index' ? './' : '../';
  return prefix + bare + (rev ? '?v=' + rev : '');
}

function fieldValue(item, field) {
  if (item == null) return null;
  if (typeof item === 'string') return item;
  if (!field) return null;
  return field.indexOf('.') === -1 ? item[field] : lookup(item, field);
}

function flattenList(arr, field) {
  const out = [];
  for (const item of arr) {
    const inner = fieldValue(item, field);
    if (Array.isArray(inner)) out.push.apply(out, inner);
    else if (typeof inner === 'string') out.push(inner);
  }
  return out;
}

function applyKind(el, kind, raw, pageKey, rev) {
  if (kind === 'text') el.setInnerContent(raw);
  else if (kind === 'href') el.setAttribute('href', raw);
  else if (kind === 'src') el.setAttribute('src', resolveAsset(raw, pageKey, rev));
  else if (kind === 'mailto') {
    el.setInnerContent(raw);
    el.setAttribute('href', 'mailto:' + raw);
  } else if (kind === 'tel') {
    el.setInnerContent(raw);
    el.setAttribute('href', 'tel:' + raw.replace(/[^\d+]/g, ''));
  }
}

function lookup(content, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), content);
}

function buildRewriter(map, content, pageKey, rev) {
  const rewriter = new HTMLRewriter();
  // several fields can share a selector, so collect the writers per selector
  // and let one handler run them in order
  const bySelector = new Map();
  const add = (sel, fn) => {
    if (!bySelector.has(sel)) bySelector.set(sel, []);
    bySelector.get(sel).push(fn);
  };

  for (const [path, def] of Object.entries(map.scalars || {})) {
    const raw = lookup(content, path);
    if (typeof raw !== 'string' || !raw) continue;
    add(def.sel, (el) => applyKind(el, def.kind, raw, pageKey, rev));
  }

  for (const def of map.lists || []) {
    const source = lookup(content, def.list);
    if (!Array.isArray(source)) continue;
    const arr = def.flatten ? flattenList(source, def.field) : source;
    let seen = 0;
    add(def.sel, (el) => {
      // handlers fire in document order, which is all we need to work out which
      // slot this element is: either the slots cycle per breakpoint copy, or
      // each slot repeats `copies` times in a row
      const i = seen++;
      const slot = def.order === 'item' ? Math.floor(i / def.copies) : i % def.slots;
      const item = arr[def.start + slot];
      if (item == null) {
        // leftover Framer cards stay in the HTML; hide them when the admin
        // deleted that slot so a delete actually disappears on the live page
        if (def.hideEmpty) el.remove();
        return;
      }
      if (def.kind === 'hide') return;
      const raw = def.flatten ? item : fieldValue(item, def.field);
      if (typeof raw !== 'string' || !raw) return;
      applyKind(el, def.kind, raw, pageKey, rev);
    });
  }

  for (const [sel, fns] of bySelector) {
    rewriter.on(sel, { element(el) { for (const fn of fns) fn(el); } });
  }
  return rewriter;
}

async function serveAssetFromKV(env, pathname) {
  const name = pathname.slice('/assets/'.length);
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return null;
  let obj;
  try {
    obj = await env.CONTENT.getWithMetadata(ASSET_PREFIX + name, { type: 'arrayBuffer' });
  } catch (e) {
    return null;
  }
  if (!obj || !obj.value) return null;
  const ext = name.split('.').pop().toLowerCase();
  return new Response(obj.value, {
    headers: {
      'Content-Type': (obj.metadata && obj.metadata.type) || MIME[ext] || 'application/octet-stream',
      // short, because re-uploading the same filename has to take effect
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  if (!env.CONTENT) return next();                    // binding missing: serve as built
  if (url.searchParams.has('nocms')) return next();   // escape hatch for debugging

  // Replaced photos live in KV under the same filename as the original, so
  // KV has to win over the file that shipped in the deploy bundle.
  if (url.pathname.startsWith('/assets/')) {
    const fromKV = await serveAssetFromKV(env, url.pathname);
    if (fromKV) return fromKV;
    return next();
  }

  const storyMatch = url.pathname.match(/^\/blogs\/([^/]+)\/?$/);
  if (storyMatch && STORY_PAGES.has(storyMatch[1]) && env.CONTENT) {
    try {
      const live = await env.CONTENT.get(CONTENT_KEY, 'json');
      const ids = new Set(((live && live.explore_stories) || []).map((s) => s && s.id));
      if (!ids.has(storyMatch[1])) {
        return Response.redirect(new URL('/blogs/', url), 302);
      }
    } catch (_) {}
  }

  const res = await next();

  if (!res.ok) return res;
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;

  const pageKey = pageKeyFor(url.pathname);
  if (!pageKey || !CONTENT_MAP[pageKey]) return res;

  let content = null;
  let rev = '';
  try {
    const [c, r] = await Promise.all([
      env.CONTENT.get(CONTENT_KEY, 'json'),
      env.CONTENT.get('site:rev'),
    ]);
    content = c;
    rev = r || '';
  } catch (e) {
    content = null;
  }
  if (!content) return res;

  const out = new Response(res.body, res);
  // the body no longer matches the deployed file, so the asset's validators
  // would hand back pre-edit HTML on the next conditional request
  out.headers.delete('ETag');
  out.headers.delete('Last-Modified');
  out.headers.set('Cache-Control', 'no-store, must-revalidate');
  out.headers.set('X-Axel-CMS', 'kv');

  try {
    return buildRewriter(CONTENT_MAP[pageKey], content, pageKey, rev).transform(out);
  } catch (e) {
    return res;                                       // never take the site down over copy
  }
}
